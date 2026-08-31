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
const browser = await chromium.launch();
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
