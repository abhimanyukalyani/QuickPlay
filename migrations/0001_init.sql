-- One row per (game_slug, client_id): each player's personal best.
-- Writes are an atomic conditional upsert (see functions/api/scores/[game].ts) that
-- only accepts a new best, and only if at least 3s have passed since the last accepted
-- write to that row — the whole rate-limit mechanism, no separate table needed.
CREATE TABLE IF NOT EXISTS scores (
  game_slug  TEXT    NOT NULL,
  client_id  TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (game_slug, client_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores (game_slug, score DESC);
