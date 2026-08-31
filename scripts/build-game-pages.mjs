// Rebuilds every public/games/<slug>/index.html from its source in games-src/.
//
//   node scripts/build-game-pages.mjs
//
// Runs as `prebuild`, so the canonical link, OG tags and share-image URLs on each game page
// always match lib/games.ts and the current NEXT_PUBLIC_SITE_URL — no need to keep the
// original sources of imported games around to change a URL.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { games } from "../lib/games.ts";
import { site } from "../lib/site.ts";
import { renderGamePage } from "./lib/game-page.mjs";

for (const game of games) {
  const source = path.join("games-src", `${game.slug}.html`);

  let fragment;
  try {
    fragment = await readFile(source, "utf8");
  } catch {
    console.error(`${game.slug}: no source at ${source} — import it or drop the entry from lib/games.ts`);
    process.exit(1);
  }

  const target = path.join("public", "games", game.slug, "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, renderGamePage(game, fragment, site));
  console.log(`${game.title} → ${target}`);
}
