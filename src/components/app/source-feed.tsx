import * as React from "react"
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { YomirraSection } from "@/components/ui/yomirra-layout";
import { ErrorState } from "@/components/states/error-state";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";
import { PopularCarousel } from "@/components/ui/popular-carousel";

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      
      {/* Left: Popular Carousel (70%) */}
      <div className="lg:col-span-8 min-w-0">
        {popular && popular.mangas.length > 0 && (
          <YomirraSection 
            title={`Top ${sourceName}`}
            action={
              <Link href={`/sources/${sourceId}?sort=popular`} className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
                Semua
              </Link>
            }
          >
            <div className="-mx-4 md:mx-0">
              <PopularCarousel sourceId={sourceId} mangas={popular.mangas} />
            </div>
          </YomirraSection>
        )}
      </div>

      {/* Right: Latest Compact List (30%) */}
      <div className="lg:col-span-4">
        {latest && latest.mangas.length > 0 && (
          <YomirraSection 
            title="Baru Rilis"
            action={
              <Link href={`/sources/${sourceId}?sort=latest`} className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
                Semua
              </Link>
            }
          >
            <div className="flex flex-col gap-3">
              {latest.mangas.slice(0, 6).map((manga) => (
                <MangaCard 
                  key={manga.id} 
                  variant="history"
                  manga={manga} 
                  sourceId={sourceId} 
                />
              ))}
            </div>
          </YomirraSection>
        )}
      </div>
      
    </div>
  );
}
