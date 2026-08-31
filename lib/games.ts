export type Game = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  controls: string;
  tags: string[];
  accent: string;
  accentAlt: string;
  backdrop: string;
  added: string;
};

export const games: Game[] = [
  {
    slug: "flipshield",
    title: "Flipshield",
    tagline:
      "Orbs converge on your core. Flip the shield into their path — and don't touch the white ones.",
    description:
      "Flipshield is a free browser reflex game. Orbs converge on your core from every direction; flip your shield into their path to bounce them back, but let the white ghosts pass straight through. One button, endless waves, no download.",
    controls: "Aim with the mouse or touch · click or space to flip",
    tags: ["Reflex", "Endless", "One button"],
    accent: "#FF2D6F",
    accentAlt: "#26E0FF",
    backdrop: "#06161B",
    added: "2026-08-31",
  },
  {
    slug: "chain-bloom",
    title: "Chain Bloom",
    tagline:
      "One click per level. Set off a single bloom and let the chain reaction do the rest.",
    description:
      "Chain Bloom is a free browser chain-reaction game across twelve levels. You get exactly one click: place your bloom, then watch it spread through the drifting field. Timing beats aim — wait for the dots to gather.",
    controls: "Click or tap anywhere in the field",
    tags: ["Chain reaction", "12 levels", "One click"],
    accent: "#FF6B35",
    accentAlt: "#B48CFF",
    backdrop: "#0E0920",
    added: "2026-08-31",
  },
];

export const gameUrl = (slug: string) => `/games/${slug}/`;
