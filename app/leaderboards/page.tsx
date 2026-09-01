import type { Metadata } from "next";
import { AdSlot } from "@/components/ad-slot";
import { LeaderboardList } from "@/components/leaderboard-list";
import { games, gameUrl } from "@/lib/games";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: `Top scores across every game on ${site.name}, submitted by players.`,
  alternates: { canonical: "/leaderboards/" },
};

export default function LeaderboardsPage() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pt-12 pb-16 sm:px-8">
      <h1 className="font-display text-[clamp(36px,7vw,64px)] uppercase leading-[0.9]">
        Leaderboards
      </h1>
      <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-dim">
        Top runs, submitted by players. Add a nickname on any game&apos;s end screen to get on
        one.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {games.map((game) => (
          <div key={game.slug} className="rounded-md border border-edge bg-surface p-5">
            <h2 className="font-display text-[20px] uppercase leading-none">
              <a href={gameUrl(game.slug)} className="transition hover:text-hot">
                {game.title}
              </a>
            </h2>
            <div className="mt-4">
              <LeaderboardList slug={game.slug} />
            </div>
          </div>
        ))}
      </div>

      <AdSlot slotId="leaderboards-below-grid" className="mt-10" />
    </section>
  );
}
