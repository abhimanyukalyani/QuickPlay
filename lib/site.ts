export const site = {
  name: "QuickPlay",
  tagline: "Free browser games. Zero setup.",
  description:
    "Free browser games that start the second you click. No download, no account, no tutorial — one minute to learn, one more to beat your score.",
  // Update once the Cloudflare Pages project exists or a real domain is bought.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://quickplay.pages.dev",
  // Cloudflare Web Analytics beacon token; analytics stays off until this is set.
  cfBeaconToken: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "",
  // AdSense publisher id ("ca-pub-..."); ad slots render nothing until this is set,
  // so the site stays clean for the AdSense review.
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
} as const;
