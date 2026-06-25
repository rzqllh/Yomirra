import { Metadata } from "next";
import { HomeView } from "@/components/app/home-view";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { SourceFeed } from "@/components/app/source-feed";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { SourceFeedWrapper } from "@/components/app/source-feed-wrapper";
import { EmptyState } from "@/components/states/empty-state";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Yomirra - Baca Komik Gratis",
  description: "Manga, Manhwa, dan Manhua reader cepat, ringan, tanpa iklan.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const disabledSourcesCookie = cookieStore.get('yomirra-disabled-sources')?.value;
  let disabledSources: string[] = [];
  
  if (disabledSourcesCookie) {
    try {
      disabledSources = JSON.parse(decodeURIComponent(disabledSourcesCookie));
    } catch(e) {}
  }

  const activeSources = sourceRegistry.filter(s => 
    s.isEnabled && 
    s.isInstalled && 
    s.status === "online" &&
    !disabledSources.includes(s.id)
  );

  return (
    <DirectionalTransition>
      <HomeView>
        {activeSources.map(source => (
          <SourceFeedWrapper key={source.id} sourceId={source.id} isNsfw={source.isNsfw || false}>
            <Suspense fallback={<SourceFeedSkeleton />}>
              <SourceFeed sourceId={source.id} sourceName={source.name} variant="C" />
            </Suspense>
          </SourceFeedWrapper>
        ))}
        
        {activeSources.length === 0 && (
          <div className="py-10">
            <EmptyState 
              icon={<WarningCircle size={40} className="text-accent" weight="duotone" />}
              title="Tidak ada sumber komik yang aktif."
              description="Periksa halaman sumber untuk mengaktifkan sumber komik."
            />
          </div>
        )}
      </HomeView>
    </DirectionalTransition>
  );
}
