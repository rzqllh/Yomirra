import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
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
    const source = sourceManager.getSource(sourceId);
    
    // Extract filters from search parameters
    const filters: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'q' && key !== 'page') {
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

    // Make cache key deterministic regarding filters
    const filterKey = Object.keys(filters).length > 0 
      ? `:${JSON.stringify(filters)}`
      : "";
    const cacheKey = `source:${sourceId}:search:${q}:${page}${filterKey}`;

    const data = await swrCache(
      cacheKey,
      () => source.search(q, page, filters),
      CACHE_TTL.SEARCH
    );

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { message: (error instanceof Error ? error.message : String(error)) || "Internal Server Error" } },
      { status: (error instanceof Error ? error.message : String(error))?.includes("not found") ? 404 : 500 }
    );
  }
}
