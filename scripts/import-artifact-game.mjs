// Turns a Claude artifact HTML export into a game source in games-src/.
//
//   node scripts/import-artifact-game.mjs <artifact.html> <slug>
//
// Artifacts are authored without <!doctype>/<html>/<head>/<body> (the artifact host wraps
// them at publish time), and the export carries that host's preview runtime at the top.
// This strips the runtime and keeps the game itself. Run build-game-pages.mjs afterwards
// (or just `npm run build`) to turn the source into the published page.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { games } from "../lib/games.ts";
import { splitDocument } from "./lib/game-page.mjs";

const [source, slug] = process.argv.slice(2);
if (!source || !slug) {
  console.error("usage: node scripts/import-artifact-game.mjs <artifact.html> <slug>");
  process.exit(1);
}

if (!games.some((game) => game.slug === slug)) {
  console.error(`no game with slug "${slug}" in lib/games.ts — add it there first`);
  process.exit(1);
}

const raw = await readFile(source, "utf8");
const wrapperEnd = raw.indexOf("</head><body>");
const fragment = (wrapperEnd === -1 ? raw : raw.slice(wrapperEnd + "</head><body>".length))
  .replace(/<\/body>\s*<\/html>\s*$/i, "")
  .trim();

if (!splitDocument(fragment).body) {
  console.error(`could not find any game markup in ${source}`);
  process.exit(1);
}

const target = path.join("games-src", `${slug}.html`);
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, fragment + "\n");
console.log(`${slug} → ${target} (${fragment.length} bytes) — now run: npm run games`);
