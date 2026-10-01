import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import type { SourceMetadata } from "@/shared/sources/source-types";
import { HomeFeedClient } from "./home-feed-client";
import type { HomeFeedManga } from "./home-feed-selection";

interface UnifiedFeedProps {
  activeSources: SourceMetadata[];
}

function interleaveArrays<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(...arrays.map((array) => array.length), 0);

  for (let index = 0; index < maxLen; index++) {
    for (const array of arrays) {
      if (index < array.length) {
        result.push(array[index]);
      }
    }
  }

  return result;
}

export async function UnifiedFeed({ activeSources }: UnifiedFeedProps) {
  if (activeSources.length === 0) return null;

  const fetchPromises = activeSources.map(async (sourceInfo) => {
    try {
      const manifestUrl = await getManifestUrlFromCookie(sourceInfo.id);
      const source = await sourceManager.getSource(sourceInfo.id, manifestUrl);

      const [popularData, latestData] = await Promise.all([
        withCache(
          `source:${sourceInfo.id}:popular:1`,
          () => source.getPopular(1),
          CACHE_TTL.DISCOVERY
        ),
        withCache(
          `source:${sourceInfo.id}:latest:1`,
          () => source.getLatest(1),
          CACHE_TTL.DISCOVERY
        ),
      ]);

      return {
        sourceId: sourceInfo.id,
        sourceName: sourceInfo.name,
        popular: popularData,
        latest: latestData,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        const message = error instanceof Error ? error.message : String(error);
        console.log(
          `\x1b[33m[UnifiedFeed] Skipped ${sourceInfo.id}: ${message}\x1b[0m`
        );
      }
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  const validResults = results.filter(
    (result): result is NonNullable<typeof result> => Boolean(result)
  );

  if (validResults.length === 0) {
    return null;
  }

  const popularArrays: HomeFeedManga[][] = validResults.map((result) =>
    (result.popular?.mangas ?? []).map((manga) => ({
      ...manga,
      sourceId: result.sourceId,
      sourceName: result.sourceName,
    }))
  );

  const latestArrays: HomeFeedManga[][] = validResults.map((result) =>
    (result.latest?.mangas ?? []).map((manga) => ({
      ...manga,
      sourceId: result.sourceId,
      sourceName: result.sourceName,
    }))
  );

  const unifiedPopular = interleaveArrays(popularArrays);
  const unifiedLatest = interleaveArrays(latestArrays);

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
