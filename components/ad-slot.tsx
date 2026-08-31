import { site } from "@/lib/site";

export function AdSlot({ slotId, className }: { slotId: string; className?: string }) {
  if (!site.adsenseClient) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block"
        data-ad-client={site.adsenseClient}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle = window.adsbygoogle || []).push({});" }} />
    </div>
  );
}
