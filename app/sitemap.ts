import type { MetadataRoute } from "next";
import { games, gameUrl } from "@/lib/games";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...games.map((game) => ({
      url: `${site.url}${gameUrl(game.slug)}`,
      lastModified: new Date(game.added),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
