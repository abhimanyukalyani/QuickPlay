import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Anton, Chivo, IBM_Plex_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });
const chivo = Chivo({ variable: "--font-chivo", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    images: ["/og/default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: ["/og/default.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${chivo.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-edge bg-ink/90 backdrop-blur">
          <div className="mx-auto flex h-[58px] w-full max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-8">
            <Link
              href="/"
              className="font-display text-[25px] uppercase leading-none tracking-[0.02em]"
            >
              Quick<span className="text-hot">play</span>
            </Link>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-dim">
              Free · no sign-up
            </span>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-edge">
          <div className="mx-auto w-full max-w-[1120px] px-4 py-8 text-[12.5px] leading-relaxed text-dim sm:px-8">
            <p>
              Every game on {site.name} is original and runs right in your browser — nothing to
              install, no account, no paywall.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} {site.name}
            </p>
          </div>
        </footer>

        {site.cfBeaconToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={`{"token": "${site.cfBeaconToken}"}`}
          />
        ) : null}

        {site.adsenseClient ? (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseClient}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
