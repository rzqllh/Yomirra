import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const query = searchParams.get("q") || "";

  // Extract filters
  const filters: Record<string, any> = {};
  searchParams.forEach((val, key) => {
    if (key !== "page" && key !== "q") {
      if (key.endsWith('[]')) {
        if (!filters[key]) filters[key] = [];
        filters[key].push(val);
      } else {
        filters[key] = val;
      }
    }
  });

  try {
    const source = sourceManager.getSource(sourceId);
    
    if (!source.capabilities.search) {
      return NextResponse.json(
        { error: { code: "SOURCE_SEARCH_UNSUPPORTED", message: `Source ${sourceId} does not support searching.`, sourceId } },
        { status: 400 }
      );
    }

    const cacheKey = `source:${sourceId}:search:${query}:${page}:${JSON.stringify(filters)}`;

    const data = await swrCache(
      cacheKey,
      () => source.search(query, page, filters),
      CACHE_TTL.DISCOVERY
    );

    return NextResponse.json({ 
      data: {
        sourceId,
        query,
        page,
        results: data.mangas,
        hasNextPage: data.hasNextPage,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const code = message.includes("not found") ? "SOURCE_NOT_FOUND" : "UPSTREAM_ERROR";
    const status = code === "SOURCE_NOT_FOUND" ? 404 : 502;
    
    return NextResponse.json(
      { error: { code, message: "An error occurred while communicating with the source.", sourceId } },
      { status }
    );
  }
}
