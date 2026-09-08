# QuickPlay

A static portal for original browser games. Every game is a self-contained HTML page on
its own indexable URL; the site around it is a Next.js app exported to plain static files.

Live games:

| Game | Genre | Route | Source |
| --- | --- | --- | --- |
| Flipshield | Reflex | `/games/flipshield/` | `games-src/flipshield.html` |
| Chain Bloom | Chain reaction | `/games/chain-bloom/` | `games-src/chain-bloom.html` |
| Slingline | Momentum | `/games/slingline/` | `games-src/slingline.html` |
| Longwave | Idle | `/games/longwave/` | `games-src/longwave.html` |
| Refract | Puzzle | `/games/refract/` | `games-src/refract.html` |
| Nocturne | Rhythm | `/games/nocturne/` | `games-src/nocturne.html` |
| Ballast | Physics | `/games/ballast/` | `games-src/ballast.html` |
| Telegraph | Typing | `/games/telegraph/` | `games-src/telegraph.html` |
| Lantern | Memory | `/games/lantern/` | `games-src/lantern.html` |

No two of them share a verb: aim-and-flip, one click, hold-and-release, wait, rotate,
tap-on-beat, drop, type, remember.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run games        # regenerate the game pages from games-src/
npm run build        # runs games, then a static export into out/
npm run serve        # serve the built site at http://localhost:3000
```

`next.config.ts` sets `output: "export"`, so the build produces a folder of static files
with no server component. Nothing in the app uses request-time APIs — keep it that way and
the site stays deployable anywhere.

## Layout

```
app/                 site shell: layout (nav/footer), home page, sitemap, robots, icon
lib/games.ts         the game registry — home grid and sitemap both read from it
lib/site.ts          site name, canonical URL, analytics/ads config from env
components/          ad slot
games-src/<slug>.html   each game's source: <style>, markup and <script>, no document shell
public/games/<slug>/    the built game page (generated — edit games-src/ instead)
public/thumbs/       gameplay stills used on the home-page cards
public/og/           1200x630 share images used in og:image tags
scripts/             the tooling below
```

Game pages are deliberately *not* React routes. Each is a complete HTML document with its
own CSS/JS, served verbatim from `public/` — so a working game can never be broken by a
site-side change. `npm run games` (which `npm run build` runs first) wraps each source in
that document, adding the `<title>`, description, canonical link and OG tags from
`lib/games.ts` and whatever `lib/site.ts` resolves the site URL to for that build. That
means changing the site's URL is a rebuild, not a hand-edit of every game page.

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
   Set `CHROME_PATH` if Playwright's bundled browser revision isn't the one on disk.

The generated PNGs are committed, so `npm run build` never needs the network.

## Testing a game

```bash
npm run build && npm run serve       # in another shell
npm run test:games http://localhost:3000
```

`scripts/test-games.mjs` drives all nine games in a real browser: every page loads without
JS errors, Refract's twelve levels are re-solved, Ballast's difficulty separation is
measured, Nocturne's on-time hits are scored, Telegraph clears typed words, Lantern's
generated paths are validated, and the home grid and sitemap are checked. 26 checks.

Each game exposes a read-only probe under `?probe=1` — absent from a normal page load —
which is how the games are driven headlessly. `window.__<slug>` gives a `snapshot()` plus
whatever inputs that game needs (`__refract.flip`, `__ballast.dropAt`, `__lantern.walkCorrectly`,
`__telegraph.type`, `__nocturne.judge`, …). That is enough to assert real behaviour rather
than just "the page loaded":

- Refract's twelve levels are **generated offline and proved solvable** by exhaustive search
  over all 2^n mirror configurations, with none solvable as it starts. The browser test
  re-solves all twelve.
- Ballast's constants were tuned by simulating thousands of runs at three skill levels.
  Expert play averages ~42 crates, loose play ~25, mashing ~12, and **no run is endless**.
  The carriage's travel widens with score so an opening drop can never be instantly fatal.
- Lantern's path generator is checked for single orthogonal steps, no revisits and in-bounds
  cells on every level it produces.
- Nocturne judges against the **AudioContext clock**, chosen once per run and held —
  `performance.now()` and `audio.currentTime` have different origins, so switching source
  mid-run would reinterpret every scheduled beat.

## Deploying (Cloudflare Pages)

**Connected.** The repo builds on Cloudflare Pages as the project `quickplay-games`, so
every push gets a deployment and every pull request a branch preview at
`https://<branch>.quickplay-games.pages.dev`.

Pages was picked over Vercel for the free tier's unmetered bandwidth and requests — a game
going viral shouldn't be able to produce a bill or a throttle.

It was connected at [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages →
Create → Pages → Connect to Git, with these settings:

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

## Configuration

All optional — the site builds and runs with none of them set.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG/sitemap base URL. Only needed for a custom domain — on Cloudflare Pages the build derives `https://<project>.pages.dev` from `CF_PAGES_URL`, and outside Cloudflare it falls back to `https://quickplay-games.pages.dev`, matching the connected Pages project. |
| `NEXT_PUBLIC_CF_BEACON_TOKEN` | Adds the Cloudflare Web Analytics beacon. Not needed on Cloudflare Pages — enabling Web Analytics on the project injects it into every page, including the static game pages. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher id (`ca-pub-…`). Until it is set, `components/ad-slot.tsx` renders nothing, so no empty ad boxes appear during the AdSense review. |

## The Lovable app

There is a parallel QuickPlay project on Lovable (React + TanStack Router + Tailwind,
Supabase-backed) holding the same nine-game registry, the design system, the routing and a
canvas game harness — but **no games**: the free-plan credits ran out before any could be
built, so every route there is still a placeholder. Its database is real and provisioned:
a `scores` table with RLS on, public read, public insert constrained to the nine known
slugs with score and name bounds, and no update or delete policy at all.

It is not wired to this repo and nothing here depends on it. To take it further, add credits
and port the game logic from `games-src/` — the probe APIs above make each game's rules
explicit enough to port without re-deriving them. Note that client-submitted scores are
spoofable by anyone with devtools; the constraints stop accidental garbage, not cheating.

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
