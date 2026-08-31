// Renders the 1200x630 share images used for og:image and the home-page cards.
//
//   node scripts/build-og-images.mjs
//
// Output is committed to public/og/, so `next build` stays offline; re-run this only
// when adding a game or changing the card design.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import React from "react";
import { ImageResponse } from "next/og.js";
import { games } from "../lib/games.ts";
import { site } from "../lib/site.ts";

const FONT_CACHE = path.join("scripts", ".fonts");
// This UA is what makes the Google Fonts API serve plain TTF: satori's font parser
// rejects both modern woff2 and the variable-font TTFs published in google/fonts,
// and an IE-era UA gets you EOT instead.
const LEGACY_UA =
  "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1) Gecko/20090624 Firefox/3.5";

async function loadFont(family, weight) {
  const cached = path.join(FONT_CACHE, `${family}-${weight}.ttf`);
  if (existsSync(cached)) return readFile(cached);

  const css = await fetch(
    `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}`,
    { headers: { "User-Agent": LEGACY_UA } },
  );
  if (!css.ok) throw new Error(`could not look up ${family}: ${css.status}`);

  const url = (await css.text()).match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error(`no font file listed for ${family} ${weight}`);

  const response = await fetch(url, { headers: { "User-Agent": LEGACY_UA } });
  if (!response.ok) throw new Error(`could not download ${family}: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.readUInt32BE(0) !== 0x00010000) {
    throw new Error(`${family} did not come back as a TTF (magic ${buffer.subarray(0, 4).toString("hex")})`);
  }
  await mkdir(FONT_CACHE, { recursive: true });
  await writeFile(cached, buffer);
  return buffer;
}

const el = React.createElement;

function card({ eyebrow, title, tagline, tags, accent, accentAlt, backdrop }) {
  return el(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: backdrop,
        backgroundImage: `radial-gradient(900px 520px at 90% 6%, ${accent}7a, transparent 62%), radial-gradient(780px 500px at 2% 98%, ${accentAlt}66, transparent 64%)`,
        color: "#F4F0FF",
        fontFamily: "Chivo",
      },
    },
    el(
      "div",
      { style: { display: "flex", fontSize: 22, letterSpacing: 6, color: "#9A8FB8" } },
      eyebrow.toUpperCase(),
    ),
    el(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      el(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Anton",
            fontSize: title.length > 12 ? 116 : 140,
            lineHeight: 1,
            letterSpacing: 1,
            textTransform: "uppercase",
          },
        },
        title,
      ),
      el(
        "div",
        {
          style: {
            display: "flex",
            marginTop: 26,
            maxWidth: 880,
            fontSize: 32,
            lineHeight: 1.35,
            color: "#C9BFE4",
          },
        },
        tagline,
      ),
    ),
    el(
      "div",
      { style: { display: "flex", gap: 14 } },
      ...tags.map((tag, index) =>
        el(
          "div",
          {
            key: tag,
            style: {
              display: "flex",
              padding: "10px 22px",
              borderRadius: 999,
              border: `2px solid ${index === 0 ? accent : "#F4F0FF33"}`,
              color: index === 0 ? accent : "#9A8FB8",
              fontSize: 20,
              letterSpacing: 3,
            },
          },
          tag.toUpperCase(),
        ),
      ),
    ),
  );
}

async function write(name, element, fonts) {
  const response = new ImageResponse(element, { width: 1200, height: 630, fonts });
  const buffer = Buffer.from(await response.arrayBuffer());
  const target = path.join("public", "og", `${name}.png`);
  await writeFile(target, buffer);
  console.log(`${target} (${Math.round(buffer.length / 1024)}kB)`);
}

const fonts = [
  { name: "Anton", data: await loadFont("Anton", 400), style: "normal", weight: 400 },
  { name: "Chivo", data: await loadFont("Chivo", 400), style: "normal", weight: 400 },
];

await mkdir(path.join("public", "og"), { recursive: true });

await write(
  "default",
  card({
    eyebrow: `${site.url.replace(/^https?:\/\//, "")}`,
    title: site.name,
    tagline: "Original games that start the second you click. No download, no account.",
    tags: ["Free to play", "No sign-up", "No download"],
    accent: "#FF3B6B",
    accentAlt: "#38E1D6",
    backdrop: "#0A0712",
  }),
  fonts,
);

for (const game of games) {
  await write(
    game.slug,
    card({
      eyebrow: `${site.name} · free browser game`,
      title: game.title,
      tagline: game.tagline,
      tags: game.tags,
      accent: game.accent,
      accentAlt: game.accentAlt,
      backdrop: game.backdrop,
    }),
    fonts,
  );
}
