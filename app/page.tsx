import Image from "next/image";
import { AdSlot } from "@/components/ad-slot";
import { games, gameUrl } from "@/lib/games";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <section className="mx-auto w-full max-w-[1120px] px-4 pt-12 pb-8 sm:px-8 sm:pt-16">
        <h1 className="font-display text-[clamp(44px,9.5vw,108px)] uppercase leading-[0.86] text-balance">
          {games.length === 1 ? "One game." : `${games.length} games.`}
          <br />
          <span className="text-cool">Zero setup.</span>
        </h1>
        <p className="mt-5 max-w-[46ch] text-[clamp(15px,1.9vw,18px)] leading-relaxed text-dim">
          {site.description.split("—")[0].trim()} —{" "}
          <b className="font-bold text-txt">
            one minute to learn, one more to beat your score.
          </b>
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
          {games.map((game) => (
            <li key={game.slug} className="flex">
              <a
                href={gameUrl(game.slug)}
                className="group flex flex-1 flex-col overflow-hidden rounded-md border border-edge bg-surface transition hover:-translate-y-[3px] hover:border-edge-strong"
              >
                <Image
                  src={`/thumbs/${game.slug}.png`}
                  alt={`${game.title} gameplay`}
                  width={1200}
                  height={675}
                  className="aspect-[16/9] w-full object-cover"
                  style={{ backgroundColor: game.backdrop }}
                  priority
                />
                <div className="flex flex-1 flex-col gap-[9px] px-[18px] pt-4 pb-[18px]">
                  <h2 className="font-display text-[27px] uppercase leading-none">
                    {game.title}
                  </h2>
                  <p className="text-[13.5px] leading-normal text-dim">{game.tagline}</p>
                  <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {game.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-edge px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-dim"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </a>
            </li>
          ))}

        </ul>

        <AdSlot slotId="home-below-grid" className="mt-10" />
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-4 pt-12 pb-16 sm:px-8">
        <h2 className="font-display text-[clamp(26px,4vw,38px)] uppercase leading-none">
          How this works
        </h2>
        <div className="mt-4 grid gap-6 text-[14px] leading-relaxed text-dim sm:grid-cols-3">
          <p>
            <b className="text-txt">Click and play.</b> Every game loads in the browser and starts
            immediately. No installs, no launcher, no account.
          </p>
          <p>
            <b className="text-txt">Made here.</b> These are original games, built for this site —
            not reposts from somewhere else.
          </p>
          <p>
            <b className="text-txt">Your scores, your call.</b> Best runs are always saved in your
            own browser first. Add a nickname if you want a run on the global leaderboard —
            nothing else about you is ever collected.
          </p>
        </div>
      </section>
    </>
  );
}
