# QuickPlay

A static portal for original browser games. Every game is a self-contained HTML page on
its own indexable URL; the site around it is a Next.js app exported to plain static files.

Live games:

| Game | Route | Source |
| --- | --- | --- |
| Flipshield | `/games/flipshield/` | `games-src/flipshield.html` |
| Chain Bloom | `/games/chain-bloom/` | `games-src/chain-bloom.html` |
| Slingline | `/games/slingline/` | `games-src/slingline.html` |
| Longwave | `/games/longwave/` | `games-src/longwave.html` |
| Refract | `/games/refract/` | `games-src/refract.html` |
| Nocturne | `/games/nocturne/` | `games-src/nocturne.html` |
| Ballast | `/games/ballast/` | `games-src/ballast.html` |
| Telegraph | `/games/telegraph/` | `games-src/telegraph.html` |
| Lantern | `/games/lantern/` | `games-src/lantern.html` |

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run games        # regenerate the game pages from games-src/
npm run build        # runs games, then a static export into out/
npm run serve        # serve the built site at http://localhost:3000
npm run test:games   # drive all nine in a real browser (needs `npm run serve` running)
npm run lint
npx tsc --noEmit
```

`next.config.ts` sets `output: "export"`, so the build produces a folder of static files
with no server component. Nothing in the app uses request-time APIs — keep it that way and
the site stays deployable anywhere.

## Testing

`scripts/test-games.mjs` opens every game in headless Chromium and asserts it actually
works, rather than merely loading: Refract's twelve levels are re-solved through the DOM,
Ballast's difficulty curve is measured across simulated runs, Nocturne's rings are hit on
the beat off its own audio clock, Lantern's generated paths are walked. Each game exposes
a read-only probe under `?probe=1` (`window.__<slug>`) that is absent from a normal page
load; that is what makes the assertions possible.

```bash
npm run build
npm run serve                        # in another shell
npm run test:games                   # or: node scripts/test-games.mjs http://localhost:3000
```

Set `CHROME_PATH` if Playwright's bundled browser revision isn't the one on disk. The
suite serves the static export, which has no Pages Functions — so `/api/scores/` 404s
there by design, and the suite asserts the leaderboard panel degrades to its empty state
instead of treating that as noise.

## Layout

```
app/                 site shell: layout (nav/footer), home page, sitemap, robots, icon
app/leaderboards/    all-games leaderboard page (client-side, fetches the API below)
lib/games.ts         the game registry — home grid and sitemap both read from it
lib/site.ts          site name, canonical URL, analytics/ads config from env
components/          ad slot, leaderboard list
functions/api/scores/[game].ts   leaderboard API (Cloudflare Pages Function, reads/writes D1)
migrations/          D1 schema for the leaderboard, applied by hand — see "Leaderboard" below
games-src/<slug>.html   each game's source: <style>, markup and <script>, no document shell
public/games/<slug>/    the built game page (generated — edit games-src/ instead)
public/leaderboard.js   shared client script every game page loads: nickname, submit, render
public/thumbs/       gameplay stills used on the home-page cards
public/og/           1200x630 share images used in og:image tags
scripts/             the tooling below: game pages, OG images, thumbnails
scripts/test-games.mjs  the headless browser suite — see "Testing" above
wrangler.toml        D1 binding config Cloudflare Pages Functions reads at deploy time
```

Game pages are deliberately *not* React routes. Each is a complete HTML document with its
own CSS/JS, served verbatim from `public/` — so a working game can never be broken by a
site-side change. `npm run games` (which `npm run build` runs first) wraps each source in
that document, adding the `<title>`, description, canonical link and OG tags from
`lib/games.ts` and the current `NEXT_PUBLIC_SITE_URL`. That means changing the site's URL
is a rebuild, not a hand-edit of three files.

## Adding a game

1. Append an entry to `games` in `lib/games.ts` (slug, title, tagline, description,
   tags, accent colours). Everything else keys off this.
2. Put the game's source at `games-src/<slug>.html` — a `<title>`, whatever `<link>` and
   `<style>` it needs, then its markup and `<script>`, with no document shell. Write it
   there directly, or, if it came from a Claude artifact, import the export:
   ```bash
   node scripts/import-artifact-game.mjs path/to/artifact-export.html <slug>
   ```
   Then `npm run games`. Games that own the whole viewport may need a one-line entry in
   `scripts/lib/game-page.mjs`'s `layoutFixups` so the floating "← QuickPlay" link doesn't
   overlap their HUD.
3. Generate the share image:
   ```bash
   node scripts/build-og-images.mjs
   ```
4. Capture the card thumbnail (needs Playwright — `npx playwright install chromium`):
   ```bash
   npm run build && npm run serve      # in another shell
   node scripts/capture-thumbs.mjs http://localhost:3000
   ```
   Add a recipe in the script if the game needs specific clicks to reach a good frame.
5. Put it on the leaderboard. Add a `GAME_BOUNDS` entry in
   `functions/api/scores/[game].ts` — without one the API 404s every submission for that
   slug, silently. Add `<div class="qp-lb" id="qp-lb"></div>` to the game's end screen and
   call `QPLeaderboard.submitScore(slug, score)` then `renderLeaderboard(el, slug)` when a
   run ends. If the score is a level rather than points, add the slug to `SCORE_FORMAT` in
   **both** `public/leaderboard.js` and `components/leaderboard-list.tsx`. A game with no
   run that ends sets `leaderboard: false` in its registry entry instead, which keeps it
   off `/leaderboards/` — Longwave is the only one.
6. Run the suite: `npm run build && npm run serve`, then `npm run test:games`. It asserts
   nine games, nine cards, eleven sitemap URLs and the leaderboard wiring, so a half-added
   game fails it.

The generated PNGs are committed, so `npm run build` never needs the network.

## Deploying (Cloudflare Pages)

Pages was picked over Vercel for the free tier's unmetered bandwidth and requests — a game
going viral shouldn't be able to produce a bill or a throttle.

The **quickplay-games** project is already connected to this repository and deploying. The
settings it was created with, for reference or for recreating it elsewhere
([dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages →
Connect to Git):

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Production branch | `main` |

The production-branch dropdown defaults to the repository's default branch, so set it to
`main` here even if the repository default is still something else — the deploy does not
depend on the GitHub setting. Node comes from `.node-version` (22); Next 16 will not build
on Cloudflare's older default.

It deploys to `<project>.pages.dev` until a custom domain is added, and the build reads its
own URL from Cloudflare's `CF_PAGES_URL`, so canonical tags, OG tags and `sitemap.xml` are
correct on the first deploy without anything being configured.

## Leaderboard (Cloudflare D1)

Each game still keeps its personal best in `localStorage`, same as always. If a player adds a
nickname, that best score is also submitted to a small global leaderboard — shown inline on the
game's own end screen and on `/leaderboards/`. The backend is a Cloudflare Pages Function
(`functions/api/scores/[game].ts`) backed by D1: one row per `(game, player)`, upserted only when
they beat their own score, throttled to one accepted write per 3 seconds per row. There are no
accounts — a player is just a random id kept in their browser's `localStorage`. This is
inherently spoofable by someone determined (there's no server-authoritative copy of any game); the
score bounds and throttle stop casual tampering, not a scripted attacker minting fresh browser ids.

`quickplay-scores` is already created and bound to the live Pages project. If it ever needs
recreating — a new Cloudflare account, a fresh environment — the steps are, done by hand in the
dashboard since this repo has no network path to `api.cloudflare.com` from its own tooling:

1. **Storage & Databases → D1 → Create database**, name it `quickplay-scores`.
2. Open its **Console** tab and run the contents of `migrations/0001_init.sql`.
3. Copy the database's UUID into `wrangler.toml`'s `database_id`, commit and push.
4. On the **quickplay-games** Pages project → **Settings → Functions → D1 database bindings**,
   add a binding: variable name `DB`, database `quickplay-scores`. Redeploy.
5. Confirm it: `curl https://quickplay-games.pages.dev/api/scores/flipshield` should return `[]`
   or real rows — not a 404 or an HTML error page, which would mean the binding didn't attach.

Local testing is fully offline, no Cloudflare account needed:

```bash
npm run build
npx wrangler d1 execute quickplay-scores --local --file=migrations/0001_init.sql
npx wrangler pages dev out
```

## Configuration

All optional — the site builds and runs with none of them set.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG/sitemap base URL. Only needed for a custom domain — on Cloudflare Pages the build derives `https://<project>.pages.dev` from `CF_PAGES_URL`, and outside Cloudflare it falls back to `https://quickplay-games.pages.dev`. |
| `NEXT_PUBLIC_CF_BEACON_TOKEN` | Adds the Cloudflare Web Analytics beacon. Not needed on Cloudflare Pages — enabling Web Analytics on the project injects it into every page, including the static game pages. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher id (`ca-pub-…`). Until it is set, `components/ad-slot.tsx` renders nothing, so no empty ad boxes appear during the AdSense review. |

## What still needs a human

- Switch the repository's default branch to `main` in GitHub → Settings → General. Not
  required for the deploy, but PRs and clones still point at the planning branch until it
  is changed.
- Turn on Web Analytics for the Pages project.
- Buy a domain when the site is worth pointing one at, then set `NEXT_PUBLIC_SITE_URL` to
  it and redeploy.
- Apply to Google AdSense once the site is live on its final domain; set
  `NEXT_PUBLIC_ADSENSE_CLIENT` after approval.
- Submit `sitemap.xml` in Google Search Console.
