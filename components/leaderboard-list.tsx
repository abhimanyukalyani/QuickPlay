"use client";

import { useEffect, useState } from "react";

type ScoreRow = { name: string; score: number; updated_at: number };

// Mirrors the formatting in public/leaderboard.js — a game's "score" isn't always points
// (Chain Bloom's is the furthest level reached). Kept as a small local map here rather
// than shared with that plain script, since the two run in different build pipelines.
const SCORE_FORMAT: Record<string, (n: number) => string> = {
  "chain-bloom": (n) => `Level ${n}`,
};

function formatScore(slug: string, score: number) {
  const fmt = SCORE_FORMAT[slug];
  return fmt ? fmt(score) : String(score);
}

export function LeaderboardList({ slug, limit = 10 }: { slug: string; limit?: number }) {
  const [rows, setRows] = useState<ScoreRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scores/${slug}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ScoreRow[]) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (rows === null) {
    return <p className="font-mono text-[12px] text-dim">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="font-mono text-[12px] text-dim">No scores yet — be the first.</p>;
  }

  return (
    <ol className="grid gap-1.5">
      {rows.slice(0, limit).map((row, i) => (
        <li key={i} className="flex items-baseline gap-2.5 font-mono text-[12.5px]">
          <span className="w-6 flex-none text-right text-dim">{i + 1}.</span>
          <span className="flex-1 truncate">{row.name}</span>
          <span className="flex-none font-semibold text-txt">{formatScore(slug, row.score)}</span>
        </li>
      ))}
    </ol>
  );
}
