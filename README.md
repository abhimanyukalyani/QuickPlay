# QuickPlay

A static portal for original browser games. Every game is a self-contained HTML page on
its own indexable URL; the site around it is a Next.js app exported to plain static files.

Live games:

| Game | Route | Source |
| --- | --- | --- |
| Flipshield | `/games/flipshield/` | `public/games/flipshield/index.html` |
| Chain Bloom | `/games/chain-bloom/` | `public/games/chain-bloom/index.html` |

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export into out/
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
public/games/<slug>/ each game, as a standalone HTML document
public/thumbs/       gameplay stills used on the home-page cards
public/og/           1200x630 share images used in og:image tags
scripts/             the tooling below
```

Game pages are deliberately *not* React routes. Each is a complete HTML document with its
own CSS/JS, dropped in `public/` and served verbatim — so a working game can never be
broken by a site-side change, and each page carries its own `<title>`, description,
canonical link and OG tags.

## Adding a game

1. Append an entry to `games` in `lib/games.ts` (slug, title, tagline, description,
   tags, accent colours). Everything else keys off this.
2. Import the game's HTML:
   ```bash
   node scripts/import-artifact-game.mjs path/to/game.html <slug>
   ```
   This strips the artifact preview wrapper, rebuilds a proper document, injects the meta
   and OG tags from `lib/games.ts`, and adds the floating "← QuickPlay" link. Games that
   own the whole viewport may need a one-line entry in the script's `layoutFixups` so that
   link doesn't overlap their HUD.
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

The generated PNGs are committed, so `npm run build` never needs the network.

## Deploying (Cloudflare Pages)

Pages was picked over Vercel for the free tier's unmetered bandwidth and requests — a game
going viral shouldn't be able to produce a bill or a throttle.

Connect the repo at [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages →
Create → Pages → Connect to Git, then:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |

It deploys to `<project>.pages.dev` until a custom domain is added.

## Configuration

All optional — the site builds and runs with none of them set.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG/sitemap base URL. Set this as soon as the real URL exists (default: `https://quickplay.pages.dev`), then re-run the OG script and rebuild. |
| `NEXT_PUBLIC_CF_BEACON_TOKEN` | Adds the Cloudflare Web Analytics beacon. Not needed on Cloudflare Pages — enabling Web Analytics on the project injects it into every page, including the static game pages. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher id (`ca-pub-…`). Until it is set, `components/ad-slot.tsx` renders nothing, so no empty ad boxes appear during the AdSense review. |

## What still needs a human

- Connect the repo to Cloudflare Pages and note the `.pages.dev` URL.
- Set `NEXT_PUBLIC_SITE_URL` to that URL (or the real domain later) and redeploy.
- Turn on Web Analytics for the Pages project.
- Buy a domain when the site is worth pointing one at, then update the URL again.
- Apply to Google AdSense once the site is live on its final domain; set
  `NEXT_PUBLIC_ADSENSE_CLIENT` after approval.
- Submit `sitemap.xml` in Google Search Console.
