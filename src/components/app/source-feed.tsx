import * as React from "react"
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { YomirraSection } from "@/components/ui/yomirra-layout";
import { ErrorState } from "@/components/states/error-state";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";

interface SourceFeedProps {
  sourceId: string;
  sourceName: string;
}

export async function SourceFeed({ sourceId, sourceName }: SourceFeedProps) {
  let popular = null;
  let latest = null;

  try {
    const source = sourceManager.getSource(sourceId);

    // Fetch on server in parallel
    const [popularData, latestData] = await Promise.all([
      swrCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY),
      swrCache(`source:${sourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY),
    ]);
    popular = popularData;
    latest = latestData;
  } catch (error) {
    console.error(`Failed to load feed for source ${sourceId}`, error);
    return (
      <div className="py-12 border border-border-subtle rounded-2xl bg-surface-raised/20 mb-12">
        <ErrorState 
          title="Gagal memuat katalog"
          description={`Gagal mengambil katalog manga dari ${sourceName}. Sumber mungkin sedang tidak tersedia.`}
        />
      </div>
    );
  }

  if (!popular?.mangas.length && !latest?.mangas.length) {
    return null;
  }

  return (
    <div className="space-y-12">
      {/* Popular Section */}
      {popular && popular.mangas.length > 0 && (
        <YomirraSection 
          title={`Populer di ${sourceName}`}
          action={
            <Link href={`/sources/${sourceId}?sort=popular`} className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
              Semua
            </Link>
          }
        >
          <HorizontalScrollContainer className="gap-3 sm:gap-4 pb-4 px-4 md:px-0 -mx-4 md:mx-0">
            {popular.mangas.slice(0, 15).map((manga, index) => (
              <div key={manga.id} className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0 snap-start first:pl-4 md:first:pl-0 last:pr-4 md:last:pr-0">
                <MangaCard 
                  variant="editorial"
                  manga={manga} 
                  sourceId={sourceId} 
                  priority={index < 4}
                />
              </div>
            ))}
          </HorizontalScrollContainer>
        </YomirraSection>
      )}

      {/* Latest Section */}
      {latest && latest.mangas.length > 0 && (
        <YomirraSection title={`Terbaru (${sourceName})`}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 px-4 md:px-0">
            {latest.mangas.slice(0, 18).map((manga) => (
              <MangaCard 
                key={manga.id} 
                variant="shelf"
                manga={manga} 
                sourceId={sourceId} 
              />
            ))}
          </div>
          
          <div className="mt-6 flex justify-center pb-2">
            <Link 
              href={`/sources/${sourceId}?sort=latest`}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "border bg-surface-overlay text-text-primary",
                "rounded-full px-6 py-4 font-bold text-sm border-border-default hover:bg-surface-hover shadow-sm"
              )}
            >
              Eksplorasi {sourceName}
            </Link>
          </div>
        </YomirraSection>
      )}
    </div>
  );
}
