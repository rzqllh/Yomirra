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
import { Clock, Play, Fire, TrendUp, Compass } from "@phosphor-icons/react/dist/ssr";
import { FeaturedHeroCarousel } from "@/components/app/featured-hero-carousel";
import { MagazineHero } from "@/components/app/magazine-hero";

interface SourceFeedProps {
  sourceId: string;
  sourceName: string;
  variant?: string;
}

export async function SourceFeed({ sourceId, sourceName, variant }: SourceFeedProps) {
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

  // Shuffle the latest data for the carousel
  // eslint-disable-next-line react-hooks/purity
  const shuffledLatest = [...(latest?.mangas || [])].sort(() => 0.5 - Math.random()).slice(0, 10);
  const top5Trending = popular?.mangas.slice(0, 5) || [];
  const restTrending = popular?.mangas.slice(5, 25) || [];

  return (
    <div className="flex flex-col gap-16">
      
      {/* SECTION: Sorotan Terbaru (Top 5) */}
      {top5Trending.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-border-subtle pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Fire weight="duotone" className="text-semantic-warning" /> Sorotan Terbaru
            </h2>
            <Link href={`/sources/${sourceId}?sort=popular`} className="text-sm font-bold text-accent hover:underline">
              Lihat Semua
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[400px]">
            {/* Hero Carousel (Left 2 columns) - 10 Random Latest */}
            <FeaturedHeroCarousel sourceId={sourceId} mangas={shuffledLatest} />

            {/* Sidebar Queue (Right 1 column) - Ranks 1 to 5 */}
            <div className="bg-surface-raised rounded-3xl p-6 border border-border-subtle flex flex-col gap-4 overflow-y-auto">
              <h4 className="font-bold text-sm text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendUp weight="duotone" /> Peringkat Populer
              </h4>
              <div className="flex flex-col gap-3">
                {top5Trending.map((manga, idx) => (
                  <MangaCard 
                    key={manga.id} 
                    manga={manga} 
                    sourceId={sourceId} 
                    rank={idx + 1} 
                    variant="editorial" 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Trending / Discovery */}
      {restTrending.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="border-b border-border-subtle pb-4">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Compass weight="duotone" className="text-accent" /> Eksplorasi
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {restTrending.map((manga, idx) => (
              <MangaCard 
                key={manga.id} 
                manga={manga} 
                sourceId={sourceId} 
                rank={idx + 6}
                variant="shelf" 
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
