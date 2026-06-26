import * as React from "react"
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { YomirraSection } from "@/components/ui/layout";
import { ErrorState } from "@/components/states/error-state";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";
import { PopularCarousel } from "@/components/app/popular-carousel";
import { Clock, Play, Fire, TrendUp, Compass } from "@phosphor-icons/react/dist/ssr";
import { FeaturedHeroCarousel } from "@/components/app/featured-hero-carousel";
import { MagazineHero } from "@/components/app/magazine-hero";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";

interface SourceFeedProps {
  sourceId: string;
  sourceName: string;
  variant?: string;
}

export async function SourceFeed({ sourceId, sourceName, variant }: SourceFeedProps) {
  let popular = null;
  let latest = null;

  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);

    // Fetch on server in parallel
    const [popularData, latestData] = await Promise.all([
      withCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY),
      withCache(`source:${sourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY),
    ]);
    popular = popularData as any;
    latest = latestData as any;
  } catch (error) {
    // Only log silently in dev to prevent Next.js Red Error Overlay
    if (process.env.NODE_ENV === "development") {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`\x1b[33m[SourceFeed] Skipped ${sourceId}: ${msg}\x1b[0m`);
    }
    // Seamless UX: Jika gagal fetch (misal server target down/403), 
    // jangan tampilkan ErrorState yang mencolok, cukup sembunyikan section ini dari homepage.
    return null;
  }

  if (!popular?.mangas.length && !latest?.mangas.length) {
    return null;
  }

  // Shuffle the latest data for the carousel
  // eslint-disable-next-line react-hooks/purity
  const shuffledLatest = [...((latest?.mangas || []) as any[])].sort(() => 0.5 - Math.random()).slice(0, 10);
  const top5Trending = (popular?.mangas as any[])?.slice(0, 5) || [];
  const restTrending = (popular?.mangas as any[])?.slice(5, 25) || [];

  return (
    <div className="flex flex-col gap-16 animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both">
      
      {/* SECTION: Sorotan Terbaru (Top 5) */}
      {top5Trending.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end pb-2">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Fire weight="duotone" className="text-semantic-warning" /> Sorotan Terbaru
            </h2>
            <Link href={`/sources/${sourceId}?sort=popular`} className="text-sm font-bold text-accent hover:underline mb-1">
              Lihat Semua
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[460px]">
            {/* Hero Carousel (Left 2 columns) - 10 Random Latest */}
            <FeaturedHeroCarousel sourceId={sourceId} mangas={shuffledLatest} />

            {/* Sidebar Queue (Right 1 column) - Ranks 1 to 5 */}
            <div className="bg-surface-raised rounded-3xl p-6 border border-border-subtle flex flex-col gap-4 overflow-y-auto">
              <h4 className="font-bold text-sm text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendUp weight="duotone" /> Peringkat Populer
              </h4>
              <div className="flex flex-col gap-3">
                {top5Trending.map((manga: any, idx: number) => (
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
            {restTrending.map((manga: any, idx: number) => (
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
