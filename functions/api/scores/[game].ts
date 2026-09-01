/// <reference types="@cloudflare/workers-types" />
//
// GET  /api/scores/<game>  -> top 50 rows for that game, highest score first.
// POST /api/scores/<game>  -> { name, score, clientId } upserts the caller's personal best.
//
// One row per (game_slug, client_id) in D1. The upsert is a single atomic conditional
// statement: it only writes when the new score beats the stored one, AND at least 3s have
// passed since the row's last accepted write. That's the entire rate-limit mechanism —
// no separate table, no extra round-trip. It stops naive repeat-submission tampering, not
// a scripted attacker minting a fresh clientId per request; that's an accepted limitation,
// not a gap to close here (see the plan this shipped from).

interface Env {
  DB: D1Database;
}

interface ScoreRow {
  name: string;
  score: number;
  updated_at: number;
}

const GAME_BOUNDS: Record<string, { min: number; max: number }> = {
  flipshield: { min: 0, max: 200_000 },
  slingline: { min: 0, max: 20_000 },
  "chain-bloom": { min: 1, max: 12 },
};

// 3-20 chars, no markup-relevant characters — belt-and-braces alongside textContent
// rendering on the client, since this is the one field strangers see from each other.
const NAME_RE = /^[A-Za-z0-9 _.-]{3,20}$/;
const CLIENT_ID_RE = /^[0-9a-f-]{36}$/i;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const game = context.params.game as string;
  if (!GAME_BOUNDS[game]) {
    return new Response("unknown game", { status: 404 });
  }

  const { results } = await context.env.DB.prepare(
    "SELECT name, score, updated_at FROM scores WHERE game_slug = ?1 ORDER BY score DESC LIMIT 50"
  )
    .bind(game)
    .all<ScoreRow>();

  return Response.json(results ?? [], {
    headers: { "cache-control": "public, max-age=15" },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const game = context.params.game as string;
  const bounds = GAME_BOUNDS[game];
  if (!bounds) {
    return new Response("unknown game", { status: 404 });
  }

  let body: { name?: unknown; score?: unknown; clientId?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const score = typeof body.score === "number" ? Math.trunc(body.score) : NaN;
  const clientId = typeof body.clientId === "string" ? body.clientId : "";

  if (!NAME_RE.test(name)) {
    return new Response("invalid name", { status: 400 });
  }
  if (!CLIENT_ID_RE.test(clientId)) {
    return new Response("invalid client", { status: 400 });
  }
  if (!Number.isFinite(score) || score < bounds.min || score > bounds.max) {
    return new Response("invalid score", { status: 400 });
  }

  const result = await context.env.DB.prepare(
    `INSERT INTO scores (game_slug, client_id, name, score, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT (game_slug, client_id) DO UPDATE SET
       name = excluded.name, score = excluded.score, updated_at = excluded.updated_at
     WHERE excluded.score > scores.score
       AND excluded.updated_at - scores.updated_at > 3000`
  )
    .bind(game, clientId, name, score, Date.now())
    .run();

  const saved = (result.meta.changes ?? 0) > 0;
  return Response.json({ saved });
};
