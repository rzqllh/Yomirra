export const dynamic = "force-dynamic";
import { applyRateLimitHeaders, checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { createHash } from "crypto";

import { assertSourceAccess, contentCacheKey, getRequestReadOptions } from "@/server/lib/sources/content-access";
import { isContentVisible } from "@/shared/sources/content-policy";
import { SourceError } from "@/server/lib/sources/error";
import { deduplicateResultsBySource } from "@/shared/lib/canonical-search";
import { upsertSearchCatalogRecords } from "@/server/lib/search/semantic-catalog";
import type { GlobalSearchResponse } from "@/shared/types/search";

export type { GlobalSearchResponse };


export async function GET(req: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(req, "publicSearch");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  const limitedJson = (body: unknown, init?: ResponseInit) =>
    applyRateLimitHeaders(NextResponse.json(body, init), rateLimit);

  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q");
  const sourcesParam = searchParams.get("sources");
  const pageParam = searchParams.get("page");
  const page = pageParam ? Number(pageParam) : 1;
  const readOptions = getRequestReadOptions(req);
  if (!Number.isInteger(page) || page < 1) return limitedJson({ error: { message: "Invalid page" } }, { status: 400 });

  const filters: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    if (!["q", "sources", "page", "hideNsfw", "dataSaver", "languages"].includes(key)) {
      const existing = filters[key];
      if (existing) {
        filters[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        filters[key] = key.endsWith("[]") ? [value] : value;
      }
    }
  });

  const queryStr = q || "";

  if (!sourcesParam) {
    return limitedJson({ error: { message: "Missing 'sources' parameter (comma separated)" } }, { status: 400 });
  }

  const sourceIds = Array.from(new Set(sourcesParam.split(",").map((id) => id.trim().toLowerCase()).filter(Boolean)));

  if (!sourceIds.length || sourceIds.length > 32) return limitedJson({ error: { message: "Select between 1 and 32 sources" } }, { status: 400 });

  let filterKey = "";
  if (Object.keys(filters).length > 0) {
    filterKey = `:${createHash("md5").update(JSON.stringify(filters)).digest("hex").slice(0, 8)}`;
  }

  const loadedSources: Record<string, any> = {};
  const sourceKeys: string[] = [];
  const sourceErrors: GlobalSearchResponse["resultsBySource"] = {};
  
  for (const sourceId of sourceIds) {
    try {
      const source = await sourceManager.getSource(sourceId);
      assertSourceAccess(source, readOptions);
      loadedSources[sourceId] = source;
      sourceKeys.push(contentCacheKey(source, "global", "", readOptions));
    } catch (error) {
      const classified = SourceError.classify(error, sourceId, "search");
      sourceErrors[sourceId] = { results: [], error: classified.message, errorCode: classified.code };
    }
  }

  const sourcesFingerprint = createHash("md5").update(sourceKeys.sort().join(",")).digest("hex").slice(0, 8);
  const cacheKey = `global:search:content-v1:${queryStr}:requested:${sourceIds.slice().sort().join(",")}:sources:${sourcesFingerprint}:page:${page}${filterKey}`;

  try {
    const cachedData = await withCache(
      cacheKey,
      async () => {
        const results: GlobalSearchResponse["resultsBySource"] = {};
        
        const promises = sourceIds.map(async (sourceId) => {
          const source = loadedSources[sourceId];
          if (!source) {
            results[sourceId] = sourceErrors[sourceId] ?? { results: [], error: "Source not found", errorCode: "SOURCE_DOWN" };
            return;
          }

          try {
            let searchResult;
            if (!queryStr && Object.keys(filters).length === 0) {
              if (!source.capabilities.latest) {
                results[sourceId] = { results: [], error: "Latest not supported by source", errorCode: "UNKNOWN" };
                return;
              }
              searchResult = await source.getLatest(page, readOptions);
            } else {
              if (!source.capabilities.search) {
                results[sourceId] = { results: [], error: "Search not supported by source", errorCode: "UNKNOWN" };
                return;
              }
              const activeFilters = Object.keys(filters).length > 0 && source.capabilities.filters ? filters : undefined;
              searchResult = await source.search(queryStr, page, activeFilters, readOptions);
            }
            results[sourceId] = {
              results: searchResult.mangas.filter((item: import("@/shared/sources/source-types").MangaItem) => isContentVisible(item, readOptions.hideNsfw !== false)),
              hasNextPage: searchResult.hasNextPage,
            };
          } catch (error: unknown) {
            const classified = SourceError.classify(error, sourceId, "search");
            results[sourceId] = {
              results: [],
              error: classified.message,
              errorCode: classified.code,
            };
          }

        });

        await Promise.allSettled(promises);
        return results;
      },
      CACHE_TTL.SEARCH
    );

    // If all results are errors, we might want to delete the cache key so it retries next time
    const allErrors = Object.values(cachedData).every(r => r.error);
    if (allErrors && isRedisConfigured) {
      await redis.del(cacheKey).catch(() => {});
    }

    const canonicalResults = deduplicateResultsBySource(cachedData);

    await upsertSearchCatalogRecords(
      canonicalResults.slice(0, 24).map((cluster) => ({
        canonicalKey: cluster.canonicalKey,
        sourceId: cluster.primaryResult.sourceId,
        mangaId: cluster.primaryResult.id,
        title: cluster.primaryResult.title,
        coverUrl: cluster.primaryResult.coverUrl,
        originalTitle: cluster.primaryResult.originalTitle,
        alternativeTitles: cluster.primaryResult.alternativeTitles,
        author: cluster.primaryResult.author,
        description: cluster.primaryResult.description,
        format: cluster.primaryResult.format,
        status: cluster.primaryResult.status,
        score: cluster.primaryResult.score,
        contentRating: cluster.primaryResult.contentRating,
        isNsfw: cluster.primaryResult.isNsfw,
        sourceBindings: cluster.sourceBindings,
      }))
    );

    return limitedJson({
      data: {
        resultsBySource: cachedData,
        canonicalResults,
      }
    });
  } catch {
    return limitedJson({ error: { message: "Internal server error" } }, { status: 500 });
  }
}

