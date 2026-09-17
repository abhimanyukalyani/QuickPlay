// Grabs a gameplay still of each game for its card on the home page.
//
//   npm run build && npm run serve        # in another shell
//   node scripts/capture-thumbs.mjs [baseUrl]
//
// Needs Playwright available (npx playwright install chromium). Output is committed to
// public/thumbs/, so re-run it only when a game's look changes or a game is added.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { games } from "../lib/games.ts";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// Per game: how to reach a frame worth showing, what to shoot, and what chrome to hide.
// `target` defaults to the game's canvas, which keeps HUD text (and its webfonts) out of
// the shot; a UI-driven game wants the page instead.
const recipes = {
  flipshield: {
    hide: ".hud",
    prep: async (page) => {
      await page.click("#start");
      await page.waitForTimeout(3500);
    },
  },
  slingline: {
    hide: ".hud",
    prep: async (page) => {
      await page.click("#start");
      await page.mouse.move(600, 340);
      await page.mouse.down();
      await page.waitForTimeout(1100);
    },
  },
  "chain-bloom": {
    prep: async (page) => {
      await page.click("#card-action");
      await page.waitForTimeout(600);
      const field = await page.locator("canvas").first().boundingBox();
      await page.mouse.click(field.x + field.width * 0.5, field.y + field.height * 0.45);
      await page.waitForTimeout(1500);
    },
  },
  refract: {
    hide: ".hud",
    query: "?probe=1",
    prep: async (page) => {
      await page.click("#start");
      await page.waitForTimeout(400);
      // a mid-run board has more mirrors on it than level one
      await page.evaluate(() => window.__refract.goto(5));
      await page.waitForTimeout(400);
    },
  },
  nocturne: {
    hide: ".hud",
    query: "?probe=1",
    prep: async (page) => {
      await page.evaluate(() => window.__nocturne.start());
      // long enough for several rings to be in flight at once
      await page.waitForTimeout(2600);
    },
  },
  ballast: {
    hide: ".hud",
    query: "?probe=1",
    prep: async (page) => {
      await page.evaluate(() => window.__ballast.start());
      // spread the load across the beam, staying near balance, so the shot
      // shows a working rig rather than one pile on the pivot
      for (const want of [-1.3, 1.4, -2.1, 2.0, -0.7, 1.1, -1.8]) {
        const s = await page.evaluate(() => window.__ballast.snapshot());
        if (s.state !== "play" || s.pendingMass == null) { await page.waitForTimeout(300); continue; }
        const safe = Math.max(-3, Math.min(3, -s.torque / s.pendingMass));
        // bias toward the requested side but never past what balance allows
        await page.evaluate((v) => window.__ballast.dropAt(v), (want + safe) / 2);
        await page.waitForTimeout(800); // a crate needs ~0.7s to land
      }
    },
  },
  telegraph: {
    hide: ".hud",
    query: "?probe=1",
    prep: async (page) => {
      await page.evaluate(() => window.__telegraph.start());
      // words drift at ~34px/s, so they need a while to spread across the wire
      await page.waitForTimeout(15000);
      // type part of the leading word so the matched-prefix colouring shows
      await page.evaluate(() => {
        const s = window.__telegraph.snapshot();
        if (s.words.length) window.__telegraph.type(s.words[0].text.slice(0, 3));
      });
      await page.waitForTimeout(200);
    },
  },
  lantern: {
    hide: ".hud",
    query: "?probe=1",
    prep: async (page) => {
      await page.evaluate(() => window.__lantern.start());
      // clear a few levels so the grid is worth looking at
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.__lantern.skipShow());
        await page.waitForTimeout(60);
        await page.evaluate(() => window.__lantern.walkCorrectly());
        await page.waitForTimeout(900);
      }
      // then catch the next level part-way through lighting its path
      await page.waitForTimeout(3200);
    },
  },
  longwave: {
    // an untouched station is an empty page, so show one that has been played a while
    query: "?probe=1",
    target: "page",
    // shot narrower than the others so its UI is legible at card size (still two-column)
    viewport: { width: 940, height: 529 },
    scale: 2,
    prep: async (page) => {
      await page.evaluate(() => window.__longwave.grant(90000));
      await page.waitForTimeout(300);
      for (const gen of [0, 0, 0, 0, 0, 0, 1, 1, 1, 2]) {
        await page.locator("#gens .row:visible").nth(gen).click();
        await page.waitForTimeout(70);
      }
      await page.locator("#ups .row:visible").first().click().catch(() => {});
      await page.waitForTimeout(800);
    },
  },
};

const base = process.argv[2] ?? "http://localhost:4173";
// CHROME_PATH lets a sandbox point at a preinstalled build when the bundled
// browser revision isn't the one on disk; normally Playwright finds its own.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
await mkdir(path.join("public", "thumbs"), { recursive: true });

for (const game of games) {
  const recipe = recipes[game.slug] ?? {};
  const page = await browser.newPage({
    viewport: recipe.viewport ?? { width: 1200, height: 675 },
    deviceScaleFactor: recipe.scale ?? 1,
  });
  await page.goto(`${base}/games/${game.slug}/${recipe.query ?? ""}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  if (recipe.prep) await recipe.prep(page);

  // an element screenshot still captures whatever floats above it, so hide the chrome
  await page.addStyleTag({ content: `.qp-home${recipe.hide ? `, ${recipe.hide}` : ""} { display: none; }` });

  const target = path.join("public", "thumbs", `${game.slug}.png`);
  if (recipe.target === "page") {
    // clicking through the prep scrolls the page; the masthead is the identifiable part
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await page.screenshot({ path: target });
  }
  else await page.locator(recipe.target ?? "canvas").first().screenshot({ path: target });

  console.log(`${game.title} → ${target}`);
  await page.close();
}

await browser.close();
