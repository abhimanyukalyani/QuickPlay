// Drives every game in a real browser and asserts it actually works.
//
//   npm run build && npm run serve        # in another shell
//   node scripts/test-games.mjs [baseUrl]
//
// Needs Playwright (npx playwright install chromium); set CHROME_PATH to point at a
// preinstalled build when the bundled browser revision isn't the one on disk.
//
// Each game exposes a read-only probe under ?probe=1 (absent from a normal page load),
// which is what makes this more than a smoke test: Refract's levels are re-solved,
// Ballast's difficulty separation is measured, Nocturne's on-time hits are scored.

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:4173";
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);

const results = [];
const pass = (n, d = "") => results.push({ ok: true, n, d });
const fail = (n, d = "") => results.push({ ok: false, n, d });

// Network failures for webfonts are sandbox egress noise, not game bugs.
const isNoise = (t) =>
  /fonts\.(googleapis|gstatic)\.com/.test(t) ||
  /ERR_CONNECTION_RESET|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED|Failed to load resource/.test(t);

async function open(slug, query = "") {
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error" && !isNoise(m.text())) errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  await page.goto(`${base}/games/${slug}/${query}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  return { page, errs };
}

const SLUGS = ["flipshield", "chain-bloom", "slingline", "longwave",
               "refract", "nocturne", "ballast", "telegraph", "lantern"];

/* ---------- 1. every page loads clean ---------- */
for (const slug of SLUGS) {
  const { page, errs } = await open(slug);
  const hasCanvas = await page.locator("canvas").count();
  const title = await page.title();
  if (errs.length) fail(`${slug} loads clean`, errs.slice(0, 2).join(" | "));
  else if (!hasCanvas) fail(`${slug} loads clean`, "no canvas");
  else if (!/QuickPlay/.test(title)) fail(`${slug} loads clean`, `title: ${title}`);
  else pass(`${slug} loads clean`, `"${title.slice(0, 42)}…"`);
  await page.close();
}

/* ---------- 2. Nocturne: audio-clock timing and miss handling ---------- */
{
  const { page, errs } = await open("nocturne", "?probe=1");
  await page.evaluate(() => window.__nocturne.start());

  // Beats are only queued LEAD (0.25s) ahead, so poll for one to appear rather
  // than sleeping — a fixed wait just lands after the beat has already been missed.
  const nextDue = async () => {
    for (let t = 0; t < 80; t++) {
      const w = await page.evaluate(() => window.__nocturne.hitNext());
      if (w !== null && w > 0.02) return w;
      await page.waitForTimeout(25);
    }
    return null;
  };

  // hit three rings dead on, by waiting until each is actually due
  let hits = 0;
  for (let i = 0; i < 3; i++) {
    const wait = await nextDue();
    if (wait === null) break;
    await page.waitForTimeout(Math.max(0, wait * 1000 - 8));
    await page.evaluate(() => window.__nocturne.judge());
    const s = await page.evaluate(() => window.__nocturne.snapshot());
    if (s.combo > hits) hits = s.combo;
  }
  const afterHits = await page.evaluate(() => window.__nocturne.snapshot());
  if (afterHits.score > 0 && afterHits.combo >= 2) pass("nocturne scores on-time hits", `score ${afterHits.score}, combo ${afterHits.combo}`);
  else fail("nocturne scores on-time hits", JSON.stringify(afterHits));

  // now ignore it entirely and confirm lives drain to a game over
  await page.waitForTimeout(6000);
  const dead = await page.evaluate(() => window.__nocturne.snapshot());
  if (dead.state === "over" || dead.lives < 3) pass("nocturne punishes misses", `state ${dead.state}, lives ${dead.lives}`);
  else fail("nocturne punishes misses", JSON.stringify(dead));
  if (errs.length) fail("nocturne no js errors", errs[0]);
  else pass("nocturne no js errors");
  await page.close();
}

/* ---------- 3. Ballast: the tuning holds up in a real browser ---------- */
{
  const { page, errs } = await open("ballast", "?probe=1");

  // A crate takes ~0.7s to fall, and the next is only queued once it lands,
  // so wait for `pendingMass` rather than guessing a delay.
  const waitForCrate = async () => {
    for (let t = 0; t < 40; t++) {
      const s = await page.evaluate(() => window.__ballast.snapshot());
      if (s.state !== "play") return s;
      if (s.pendingMass != null) return s;
      await page.waitForTimeout(60);
    }
    return page.evaluate(() => window.__ballast.snapshot());
  };

  // careless: every crate on the same side must capsize
  await page.evaluate(() => window.__ballast.start());
  for (let i = 0; i < 40; i++) {
    const s = await waitForCrate();
    if (s.state !== "play" || s.pendingMass == null) break;
    await page.evaluate(() => window.__ballast.dropAt(3.5));
  }
  const careless = await page.evaluate(() => window.__ballast.snapshot());
  if (careless.state === "over") pass("ballast punishes one-sided dumping", `capsized at ${careless.score} crates`);
  else fail("ballast punishes one-sided dumping", JSON.stringify(careless));

  // skilled: cancel the running torque each time and survive far longer
  await page.evaluate(() => window.__ballast.start());
  let placed = 0;
  for (let i = 0; i < 40; i++) {
    const s = await waitForCrate();
    if (s.state !== "play" || s.pendingMass == null) break;
    const ideal = Math.max(-4, Math.min(4, -s.torque / s.pendingMass));
    await page.evaluate((x) => window.__ballast.dropAt(x), ideal);
    placed = s.score;
  }
  const skilled = await page.evaluate(() => window.__ballast.snapshot());
  if (placed > careless.score * 2) pass("ballast rewards balance", `${placed} crates vs ${careless.score} careless`);
  else fail("ballast rewards balance", `skilled ${placed}, careless ${careless.score}`);
  if (errs.length) fail("ballast no js errors", errs[0]);
  else pass("ballast no js errors");
  await page.close();
}

/* ---------- 4. Telegraph: typing clears words, misses cost lives ---------- */
{
  const { page, errs } = await open("telegraph", "?probe=1");
  await page.evaluate(() => window.__telegraph.start());
  await page.waitForTimeout(1400);

  // words spawn every ~2.5s at first, so wait for one rather than poll blindly
  let cleared = 0;
  for (let i = 0; i < 6; i++) {
    for (let t = 0; t < 40; t++) {
      const s = await page.evaluate(() => window.__telegraph.snapshot());
      if (s.state !== "play") break;
      if (s.words.length) break;
      await page.waitForTimeout(100);
    }
    const w = await page.evaluate(() => window.__telegraph.clearFirst());
    if (w) cleared++;
    await page.waitForTimeout(120);
  }
  const typed = await page.evaluate(() => window.__telegraph.snapshot());
  if (typed.score >= 3) pass("telegraph clears typed words", `${typed.score} sent, ${typed.wpm} wpm`);
  else fail("telegraph clears typed words", JSON.stringify({ score: typed.score, cleared }));

  // a wrong letter must only reset the buffer, never cost a life
  const livesBefore = typed.lives;
  await page.evaluate(() => window.__telegraph.type("qqqq"));
  const afterBad = await page.evaluate(() => window.__telegraph.snapshot());
  if (afterBad.lives === livesBefore && afterBad.typed === "") pass("telegraph wrong letters are free", `lives still ${afterBad.lives}`);
  else fail("telegraph wrong letters are free", JSON.stringify(afterBad));
  if (errs.length) fail("telegraph no js errors", errs[0]);
  else pass("telegraph no js errors");
  await page.close();
}

/* ---------- 5. Lantern: paths are always walkable ---------- */
{
  const { page, errs } = await open("lantern", "?probe=1");
  await page.evaluate(() => window.__lantern.start());
  await page.waitForTimeout(300);

  let levelsCleared = 0;
  let badPath = null;
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.__lantern.skipShow());
    await page.waitForTimeout(80);
    const s = await page.evaluate(() => window.__lantern.snapshot());

    // validate the generated path: single orthogonal steps, no revisits, in bounds
    const seen = new Set();
    for (let k = 0; k < s.path.length; k++) {
      const [x, y] = s.path[k];
      if (x < 0 || y < 0 || x >= s.grid[0] || y >= s.grid[1]) badPath = `out of bounds at ${k}`;
      if (seen.has(`${x},${y}`)) badPath = `revisits cell at ${k}`;
      seen.add(`${x},${y}`);
      if (k > 0) {
        const d = Math.abs(x - s.path[k - 1][0]) + Math.abs(y - s.path[k - 1][1]);
        if (d !== 1) badPath = `non-adjacent step at ${k}`;
      }
    }
    if (s.path.length !== s.length) badPath = `length ${s.path.length} != ${s.length}`;

    await page.evaluate(() => window.__lantern.walkCorrectly());
    await page.waitForTimeout(950);
    const after = await page.evaluate(() => window.__lantern.snapshot());
    if (after.level > s.level) levelsCleared++;
  }
  if (badPath) fail("lantern paths are valid", badPath);
  else pass("lantern paths are valid", "8 levels checked: adjacent, no revisits, in bounds");
  if (levelsCleared >= 6) pass("lantern advances levels", `${levelsCleared} levels cleared`);
  else fail("lantern advances levels", `only ${levelsCleared}`);
  if (errs.length) fail("lantern no js errors", errs[0]);
  else pass("lantern no js errors");
  await page.close();
}

/* ---------- 6. Refract: every level still solvable ---------- */
{
  const { page, errs } = await open("refract", "?probe=1");
  await page.click("#start");
  await page.waitForTimeout(250);
  const n = await page.evaluate(() => window.__refract.levels);
  let solvedCount = 0;
  for (let lv = 0; lv < n; lv++) {
    await page.evaluate((i) => window.__refract.goto(i), lv);
    await page.waitForTimeout(40);
    const before = await page.evaluate(() => window.__refract.snapshot());
    const bits = before.mirrors.length;
    let done = false;
    for (let cfg = 0; cfg < (1 << bits) && !done; cfg++) {
      const cur = await page.evaluate(() => window.__refract.snapshot().mirrors.map((m) => m[2]));
      for (let i = 0; i < bits; i++) {
        if (cur[i] !== ((cfg >> i) & 1)) await page.evaluate((k) => window.__refract.flip(k), i);
      }
      const s = await page.evaluate(() => window.__refract.snapshot());
      if (s.lit === s.targets) done = true;
    }
    if (done) solvedCount++;
  }
  if (solvedCount === n) pass("refract all levels solvable", `${solvedCount}/${n} in-browser`);
  else fail("refract all levels solvable", `${solvedCount}/${n}`);
  if (errs.length) fail("refract no js errors", errs[0]);
  else pass("refract no js errors");
  await page.close();
}

/* ---------- 7. home page and sitemap reflect all nine ---------- */
{
  const page = await browser.newPage();
  await page.goto(base, { waitUntil: "domcontentloaded" });
  const cards = await page.locator("main ul li a[href^='/games/']").count();
  const heading = (await page.locator("h1").first().innerText()).replace(/\s+/g, " ");
  if (cards === 9) pass("home lists all nine games", `${cards} cards`);
  else fail("home lists all nine games", `${cards} cards`);
  if (/9 games/i.test(heading)) pass("home headline counts nine", heading.slice(0, 30));
  else fail("home headline counts nine", heading.slice(0, 40));

  const sm = await (await fetch(`${base}/sitemap.xml`)).text();
  const urls = (sm.match(/<loc>/g) || []).length;
  if (urls === 10) pass("sitemap has home + nine games", `${urls} urls`);
  else fail("sitemap has home + nine games", `${urls} urls`);
  await page.close();
}

await browser.close();

console.log("");
for (const r of results) console.log(`${r.ok ? "  PASS" : "  FAIL"}  ${r.n}${r.d ? "  — " + r.d : ""}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
