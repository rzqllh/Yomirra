import { Metadata } from "next";
import { HomeView } from "@/components/app/home-view";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { SourceFeed } from "@/components/app/source-feed";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { Suspense } from "react";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { SourceFeedWrapper } from "@/components/app/source-feed-wrapper";

export const metadata: Metadata = {
  title: "Yomirra - Baca Komik Gratis",
  description: "Manga, Manhwa, dan Manhua reader cepat, ringan, tanpa iklan.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activeSources = sourceRegistry.filter(s => s.isEnabled && s.isInstalled && s.status === "online");

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
          <div className="py-24 text-center">
            <p className="text-text-muted">Tidak ada sumber komik yang aktif.</p>
          </div>
        )}
      </HomeView>
    </DirectionalTransition>
  );
}
