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
  {
    slug: "slingline",
    title: "Slingline",
    tagline:
      "Catch a pin, swing around it, let go at the right moment — and never stop moving.",
    description:
      "Slingline is a free browser arcade game about momentum. Hold to catch the nearest pin and swing around it, then release to fly off the curve towards the next one. Every pin burns out while you hang on it, so stopping is never an option.",
    controls: "Hold the mouse, space or a finger · release to fly",
    tags: ["Momentum", "Endless", "Hold & release"],
    accent: "#FF7A18",
    accentAlt: "#FFD166",
    backdrop: "#0C0605",
    added: "2026-08-31",
  },
  {
    slug: "longwave",
    title: "Longwave",
    tagline:
      "Point a dish at the dark and listen. The signal keeps coming in while you're gone.",
    description:
      "Longwave is a free browser idle game. Listen for a faint signal, spend it on antennas that listen for you, and decode a transmission line by line. It keeps running while the tab is closed, and your progress is saved in your own browser.",
    controls: "Click to listen · buy antennas · come back later",
    tags: ["Idle", "Incremental", "Runs while away"],
    accent: "#5BFFA5",
    accentAlt: "#FFC46B",
    backdrop: "#04120C",
    added: "2026-08-31",
  },
];

export const gameUrl = (slug: string) => `/games/${slug}/`;
