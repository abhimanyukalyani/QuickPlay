// Cloudflare Pages exposes the deployment URL as CF_PAGES_URL, but it points at the
// immutable per-deployment host (https://<deployment-id>.<project>.pages.dev). Dropping
// that first label yields the stable project host the site is actually served from, so a
// Git-connected Pages build knows its own canonical URL without anyone hardcoding it.
function projectUrlFromCloudflare(): string | undefined {
  const deploymentUrl = process.env.CF_PAGES_URL;
  if (!deploymentUrl) return undefined;

  try {
    const { protocol, host } = new URL(deploymentUrl);
    const labels = host.split(".");
    // <deployment-id>.<project>.pages.dev is 4 labels; <project>.pages.dev is already stable.
    const stableHost = host.endsWith(".pages.dev") && labels.length > 3
      ? labels.slice(1).join(".")
      : host;
    return `${protocol}//${stableHost}`;
  } catch {
    return undefined;
  }
}

export const site = {
  name: "QuickPlay",
  tagline: "Free browser games. Zero setup.",
  description:
    "Free browser games that start the second you click. No download, no account, no tutorial — one minute to learn, one more to beat your score.",
  // NEXT_PUBLIC_SITE_URL wins (custom domain); otherwise a Cloudflare Pages build fills in
  // its own *.pages.dev host. The literal is only reached by local and direct-upload builds.
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    projectUrlFromCloudflare() ??
    "https://quickplay-games.pages.dev"
  ).replace(/\/+$/, ""),
  // Cloudflare Web Analytics beacon token; analytics stays off until this is set.
  cfBeaconToken: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "",
  // AdSense publisher id ("ca-pub-..."); ad slots render nothing until this is set,
  // so the site stays clean for the AdSense review.
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
} as const;
