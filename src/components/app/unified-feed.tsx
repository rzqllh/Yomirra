import { MangaItem } from "@/shared/sources/source-types";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { SourceMetadata } from "@/shared/sources/source-types";
import { HomeFeedClient } from "./home-feed-client";

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

  return (
    <HomeFeedClient 
      unifiedPopular={unifiedPopular} 
      unifiedLatest={unifiedLatest} 
    />
  );
}
