// Grabs a gameplay still of each game for its card on the home page.
//
//   npm run build && npx serve out -l 4173     # or any static server on the built site
//   node scripts/capture-thumbs.mjs [baseUrl]
//
// Needs Playwright available (npx playwright install chromium). Output is committed to
// public/thumbs/, so re-run it only when a game's look changes or a game is added.
// Only the game's own canvas is captured — no HUD, so no text and no font dependency.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { games } from "../lib/games.ts";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// How to get each game past its start screen and into a frame worth showing.
const recipes = {
  flipshield: async (page) => {
    await page.click("#start");
    await page.waitForTimeout(3500);
  },
  "chain-bloom": async (page) => {
    await page.click("#card-action");
    await page.waitForTimeout(600);
    const field = await page.locator("canvas").first().boundingBox();
    await page.mouse.click(field.x + field.width * 0.5, field.y + field.height * 0.45);
    await page.waitForTimeout(1500);
  },
};

// Game chrome drawn on top of the canvas, hidden so the still is pure gameplay art.
const overlays = { flipshield: ".hud" };

const base = process.argv[2] ?? "http://localhost:4173";
const browser = await chromium.launch();
await mkdir(path.join("public", "thumbs"), { recursive: true });

for (const game of games) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
  await page.goto(`${base}/games/${game.slug}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const recipe = recipes[game.slug];
  if (recipe) await recipe(page);

  // An element screenshot still captures whatever floats above it, so hide the chrome.
  await page.addStyleTag({ content: `.qp-home, ${overlays[game.slug] ?? ".qp-home"} { display: none; }` });

  const target = path.join("public", "thumbs", `${game.slug}.png`);
  await page.locator("canvas").first().screenshot({ path: target });
  console.log(`${game.title} → ${target}`);
  await page.close();
}

await browser.close();
