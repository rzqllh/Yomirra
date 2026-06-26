import * as React from "react"
import { MangaItem } from "@/shared/sources/source-types";
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { ErrorState } from "@/components/states/error-state";
import { Fire, TrendUp, Compass } from "@phosphor-icons/react/dist/ssr";
import { FeaturedHeroCarousel } from "@/components/app/featured-hero-carousel";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { SourceMetadata } from "@/shared/sources/source-types";

interface UnifiedFeedProps {
  activeSources: SourceMetadata[];
}

function interleaveArrays<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(...arrays.map(arr => arr.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) {
        result.push(arr[i]);
      }
    }
  }
  return result;
}

export async function UnifiedFeed({ activeSources }: UnifiedFeedProps) {
  if (activeSources.length === 0) return null;

  // Fetch all sources in parallel
  const fetchPromises = activeSources.map(async (sourceInfo) => {
    try {
      const manifestUrl = await getManifestUrlFromCookie(sourceInfo.id);
      const source = await sourceManager.getSource(sourceInfo.id, manifestUrl);

      const [popularData, latestData] = await Promise.all([
        withCache(`source:${sourceInfo.id}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY),
        withCache(`source:${sourceInfo.id}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY),
      ]);

      return {
        sourceId: sourceInfo.id,
        popular: popularData as any,
        latest: latestData as any,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`\x1b[33m[UnifiedFeed] Skipped ${sourceInfo.id}: ${msg}\x1b[0m`);
      }
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  const validResults = results.filter(Boolean);

  if (validResults.length === 0) {
    return null;
  }

  // Extract arrays and add sourceId to each manga
  const popularArrays = validResults.map(r => 
    (r!.popular?.mangas || []).map((m: any) => ({ ...m, sourceId: r!.sourceId }))
  );
  
  const latestArrays = validResults.map(r => 
    (r!.latest?.mangas || []).map((m: any) => ({ ...m, sourceId: r!.sourceId }))
  );

  // Interleave the arrays
  const unifiedPopular = interleaveArrays(popularArrays) as (MangaItem & { sourceId: string })[];
  const unifiedLatest = interleaveArrays(latestArrays) as (MangaItem & { sourceId: string })[];

  if (unifiedPopular.length === 0 && unifiedLatest.length === 0) {
    return null;
  }

  // Shuffle the latest data for the carousel (take top 15 from interleaved)
  // eslint-disable-next-line react-hooks/purity
  const shuffledLatest = [...unifiedLatest].sort(() => 0.5 - Math.random()).slice(0, 15);
  const top5Trending = unifiedPopular.slice(0, 5);
  const restTrending = unifiedPopular.slice(5, 30);

  return (
    <div className="flex flex-col gap-16 animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both">
      
      {/* SECTION: Sorotan Terbaru (Top 5) */}
      {top5Trending.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end pb-2">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Fire weight="duotone" className="text-semantic-warning" /> 
              <span>Sorotan Utama</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">
            {/* Hero Carousel (Left 2 columns) - Random Latest */}
            <FeaturedHeroCarousel sourceId={shuffledLatest[0]?.sourceId || activeSources[0].id} mangas={shuffledLatest} />

            {/* Sidebar Queue (Right 1 column) - Ranks 1 to 5 */}
            <div className="bg-surface-raised rounded-3xl p-6 border border-border-subtle flex flex-col gap-4 overflow-y-auto">
              <h4 className="font-bold text-sm text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendUp weight="duotone" /> Peringkat Populer
              </h4>
              <div className="flex flex-col gap-3">
                {top5Trending.map((manga: any, idx: number) => (
                  <MangaCard 
                    key={`${manga.sourceId}-${manga.id}`} 
                    manga={manga} 
                    sourceId={manga.sourceId} 
                    rank={idx + 1} 
                    variant="editorial" 
                    showSourceBadge={true}
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
              <Compass weight="duotone" className="text-accent" /> 
              <span>Eksplorasi</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {restTrending.map((manga: any, idx: number) => (
              <MangaCard 
                key={`${manga.sourceId}-${manga.id}`} 
                manga={manga} 
                sourceId={manga.sourceId} 
                rank={idx + 6}
                variant="shelf" 
                showSourceBadge={true}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
