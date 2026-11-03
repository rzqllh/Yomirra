export const dynamic = "force-dynamic";
import { createHash } from "crypto";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { assertSourceAccess, contentCacheKey, getRequestReadOptions, sourceErrorResponse } from "@/server/lib/sources/content-access";
import { isContentVisible } from "@/shared/sources/content-policy";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { searchSchema, sourceParamsSchema } from "@/server/lib/validation/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }

  const paramValidation = sourceParamsSchema.safeParse(await params);
  if (!paramValidation.success) {
    return NextResponse.json({ error: { message: "Invalid parameters", details: paramValidation.error.format() } }, { status: 400 });
  }
  const { sourceId } = paramValidation.data;

  const searchParams = request.nextUrl.searchParams;
  const queryValidation = searchSchema.safeParse({ 
    q: searchParams.get("q") || "", 
    page: searchParams.get("page") 
  });
  
  if (!queryValidation.success) {
    return NextResponse.json({ error: { message: "Invalid query parameters", details: queryValidation.error.format() } }, { status: 400 });
  }
  const { q, page } = queryValidation.data;

  try {
    const source = await sourceManager.getSource(sourceId, request.nextUrl.searchParams.get("manifestUrl"));
    
    // Extract filters from search parameters
    const readOptions = getRequestReadOptions(request);
    assertSourceAccess(source, readOptions);
    const filters: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      if (!['q', 'page', 'hideNsfw', 'dataSaver', 'languages', 'manifestUrl'].includes(key)) {
        if (filters[key]) {
          if (Array.isArray(filters[key])) {
            (filters[key] as string[]).push(value);
          } else {
            filters[key] = [filters[key] as string, value];
          }
        } else {
          // Check if it's an array key like genre[]
          if (key.endsWith('[]')) {
            filters[key] = [value];
          } else {
            filters[key] = value;
          }
        }
      }
    });

    const filterKey = Object.keys(filters).length > 0 
      ? `:${createHash("md5").update(JSON.stringify(filters)).digest("hex").slice(0, 8)}`
      : "";
    const cacheKey = contentCacheKey(source, "search", `v5:${q}:${page}${filterKey}`, readOptions);

    const data = await withCache(
      cacheKey,
      () => source.search(q, page, filters, readOptions),
      CACHE_TTL.SEARCH
    );

    return NextResponse.json({ data: { ...data, mangas: data.mangas.filter((item) => isContentVisible(item, readOptions.hideNsfw !== false)) } });
  } catch (error: unknown) {
    const response = sourceErrorResponse(error, sourceId, "search");
    return NextResponse.json(response.body, { status: response.status });
  }
}
