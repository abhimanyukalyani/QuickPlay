// Turns a Claude artifact HTML export into a standalone game page under public/games/<slug>/.
//
//   node scripts/import-artifact-game.mjs <artifact.html> <slug>
//
// Artifacts are authored without <!doctype>/<html>/<head>/<body> (the artifact host wraps
// them at publish time), and the export carries that host's preview runtime at the top.
// This strips the runtime, splits the head-ish nodes from the body, and rebuilds a real
// document with the SEO/OG metadata a shareable game URL needs.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { games } from "../lib/games.ts";
import { site } from "../lib/site.ts";

// Games own their whole viewport, so the floating home link needs a little room made for it.
const layoutFixups = {
  flipshield: ".hud { padding-top: 46px; }",
  "chain-bloom": ".frame { padding-top: 54px; }",
};

const HEAD_NODE = /^(\s+|<!--[\s\S]*?-->|<title>[\s\S]*?<\/title>|<style[\s\S]*?<\/style>|<link\b[^>]*>|<meta\b[^>]*>|<base\b[^>]*>)/i;

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function splitDocument(raw) {
  const bodyStart = raw.indexOf("</head><body>");
  let content = bodyStart === -1 ? raw : raw.slice(bodyStart + "</head><body>".length);
  content = content.replace(/<\/body>\s*<\/html>\s*$/i, "").trim();

  let cursor = 0;
  for (;;) {
    const match = content.slice(cursor).match(HEAD_NODE);
    if (!match || match[0].length === 0) break;
    cursor += match[0].length;
  }

  return {
    head: content.slice(0, cursor).replace(/<title>[\s\S]*?<\/title>/i, "").trim(),
    body: content.slice(cursor).trim(),
  };
}

function render(game, { head, body }) {
  const url = `${site.url}/games/${game.slug}/`;
  const image = `${site.url}/og/${game.slug}.png`;
  const title = `${game.title} — Play Free Online | ${site.name}`;
  const fixup = layoutFixups[game.slug] ?? "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(game.description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<meta name="theme-color" content="${game.backdrop}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(game.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(game.description)}">
<meta name="twitter:image" content="${image}">
${head}
<style>
  .qp-home {
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 9999;
    display: inline-block;
    padding: 7px 12px;
    border: 1px solid rgba(244, 240, 255, 0.18);
    border-radius: 999px;
    background: rgba(10, 7, 18, 0.72);
    color: #f4f0ff;
    font: 600 11px/1 ui-monospace, "SFMono-Regular", Menlo, monospace;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    backdrop-filter: blur(6px);
  }
  .qp-home:hover { border-color: rgba(244, 240, 255, 0.4); }
  ${fixup}
</style>
</head>
<body>
<a class="qp-home" href="/">← ${site.name}</a>
${body}
</body>
</html>
`;
}

const [source, slug] = process.argv.slice(2);
if (!source || !slug) {
  console.error("usage: node scripts/import-artifact-game.mjs <artifact.html> <slug>");
  process.exit(1);
}

const game = games.find((entry) => entry.slug === slug);
if (!game) {
  console.error(`no game with slug "${slug}" in lib/games.ts — add it there first`);
  process.exit(1);
}

const parts = splitDocument(await readFile(source, "utf8"));
if (!parts.body) {
  console.error(`could not find any body content in ${source}`);
  process.exit(1);
}

const target = path.join("public", "games", slug, "index.html");
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, render(game, parts));
console.log(`${game.title} → ${target} (${parts.body.length} bytes of game markup)`);
