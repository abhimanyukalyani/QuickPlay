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
  {
    slug: "refract",
    title: "Refract",
    tagline:
      "A beam enters the grid. Turn the mirrors until it passes through every ring at once.",
    description:
      "Refract is a free browser puzzle game across twelve levels. Click a mirror to flip it, route the beam through every ring, and open the next board. No timer and no guessing — every level is proved solvable before it ships.",
    controls: "Click a mirror to turn it · R to reset the level",
    tags: ["Puzzle", "12 levels", "Deterministic"],
    accent: "#38E1D6",
    accentAlt: "#B48CFF",
    backdrop: "#060B1A",
    added: "2026-09-08",
  },
  {
    slug: "nocturne",
    title: "Nocturne",
    tagline:
      "Rings close on the circle. Hit each one the moment it lands, and keep the combo alive.",
    description:
      "Nocturne is a free browser rhythm game. Rings shrink toward a steady circle — tap, click or press space the instant one arrives. Dead-on hits score double, the tempo creeps up, and three missed rings end the night.",
    controls: "Tap, click or space on the beat",
    tags: ["Rhythm", "Endless", "One button"],
    accent: "#FF3B6B",
    accentAlt: "#7C5CFF",
    backdrop: "#0B0618",
    added: "2026-09-08",
  },
  {
    slug: "ballast",
    title: "Ballast",
    tagline:
      "The carriage slides, the crate drops, the beam leans. Cancel every lean with the next one.",
    description:
      "Ballast is a free browser physics game about balance. A carriage sweeps across a pivoted beam and you tap to release each crate. Weight times distance is all that matters — and the crates get heavier while the carriage gets faster.",
    controls: "Tap, click or space to drop",
    tags: ["Physics", "Balance", "Endless"],
    accent: "#FFC53D",
    accentAlt: "#6BD3FF",
    backdrop: "#101018",
    added: "2026-09-08",
  },
  {
    slug: "telegraph",
    title: "Telegraph",
    tagline:
      "Words run down the wire toward the dead line. Type them off it before they arrive.",
    description:
      "Telegraph is a free browser typing game. Words travel along five wires and clear the moment you finish typing them — longer words are worth more, wrong letters cost nothing but the buffer, and three words reaching the far end end the run.",
    controls: "Type the word · backspace to clear",
    tags: ["Typing", "Speed", "Endless"],
    accent: "#5BE8FF",
    accentAlt: "#A8FF60",
    backdrop: "#04101A",
    added: "2026-09-08",
  },
  {
    slug: "lantern",
    title: "Lantern",
    tagline:
      "A path lights up in the dark, then the dark comes back. Walk it from memory.",
    description:
      "Lantern is a free browser memory game. A winding path lights up cell by cell, then vanishes — tap it back in order from memory. Every level adds a step and widens the grid, and three wrong turns put the lantern out.",
    controls: "Watch the path · tap the cells in order",
    tags: ["Memory", "Levels", "One tap"],
    accent: "#FFD166",
    accentAlt: "#FF7A18",
    backdrop: "#0A0A0F",
    added: "2026-09-08",
  },
];

export const gameUrl = (slug: string) => `/games/${slug}/`;
