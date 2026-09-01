// Shared between the artifact importer and the page builder.
//
// A game source in games-src/ is a fragment, not a document: a <title>, the font <link>,
// a <style> block, then the game's markup and <script>. That is how the games are authored
// (and how Claude artifacts are authored, which is where the first two came from). This
// module turns one into the real page, adding the metadata a shareable game URL needs.

// Games own the whole viewport, so make room for the floating home link.
export const layoutFixups = {
  flipshield: ".hud { padding-top: 46px; }",
  "chain-bloom": ".frame { padding-top: 54px; }",
};

const HEAD_NODE =
  /^(\s+|<!--[\s\S]*?-->|<title>[\s\S]*?<\/title>|<style[\s\S]*?<\/style>|<link\b[^>]*>|<meta\b[^>]*>|<base\b[^>]*>)/i;

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Splits leading head-ish nodes off the game's markup. Also tolerates a full document, so
// this can strip the preview wrapper an artifact export arrives with.
export function splitDocument(raw) {
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

export function renderGamePage(game, fragment, site) {
  const { head, body } = splitDocument(fragment);
  if (!body) throw new Error(`no game markup found for ${game.slug}`);

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
<script src="/leaderboard.js"></script>
</body>
</html>
`;
}
