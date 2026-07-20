import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { MangaItem } from "@/shared/sources/source-types";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { redis } from "@/server/lib/cache/redis";
import { createHash } from "crypto";

export interface GlobalSearchResponse {
  resultsBySource: Record<string, {
    results: MangaItem[];
    hasNextPage?: boolean;
    error?: string;
  }>;
}

export async function GET(req: NextRequest) {
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }

  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q");
  const sourcesParam = searchParams.get("sources");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const filters: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    if (key !== "q" && key !== "sources" && key !== "page") {
      const existing = filters[key];
      if (existing) {
        filters[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        filters[key] = key.endsWith("[]") ? [value] : value;
      }
    }
  });

  // Removed 400 error for empty query so it can fallback to getLatest

  const queryStr = q || "";

  if (!sourcesParam) {
    return NextResponse.json({ error: { message: "Missing 'sources' parameter (comma separated)" } }, { status: 400 });
  }

  const sourceIds = sourcesParam.split(",").filter(Boolean);

  let filterKey = "";
  if (Object.keys(filters).length > 0) {
    filterKey = `:${createHash("md5").update(JSON.stringify(filters)).digest("hex").slice(0, 8)}`;
  }
  const cacheKey = `global:search:${queryStr}:sources:${sourceIds.sort().join(",")}:page:${page}${filterKey}`;

  try {
    const cachedData = await withCache(
      cacheKey,
      async () => {
        const results: GlobalSearchResponse["resultsBySource"] = {};
        
        const promises = sourceIds.map(async (sourceId) => {
          let source;
          try {
            source = await sourceManager.getSource(sourceId);
          } catch {
            results[sourceId] = { results: [], error: "Source not found" };
            return;
          }

          try {
            let searchResult;
            if (!queryStr && Object.keys(filters).length === 0) {
              searchResult = await source.getLatest(page);
            } else {
              if (!source.capabilities.search) {
                results[sourceId] = { results: [], error: "Search not supported by source" };
                return;
              }
              searchResult = await source.search(queryStr, page, Object.keys(filters).length > 0 ? filters : undefined);
            }
            results[sourceId] = {
              results: searchResult.mangas,
              hasNextPage: searchResult.hasNextPage,
            };
          } catch (error: unknown) {
            results[sourceId] = {
              results: [],
              error: error instanceof Error ? error.message : "Search failed",
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
    if (allErrors && redis) {
      await redis.del(cacheKey).catch(() => {});
    }

    return NextResponse.json({
      data: {
        resultsBySource: cachedData
      }
    });
  } catch {
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
