import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { MangaItem } from "@/shared/sources/source-types";

export interface GlobalSearchResponse {
  resultsBySource: Record<string, {
    results: MangaItem[];
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

  const filters: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    if (key !== "q" && key !== "sources") {
      const existing = filters[key];
      if (existing) {
        filters[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        filters[key] = key.endsWith("[]") ? [value] : value;
      }
    }
  });

  if (!q) {
    return NextResponse.json({ error: { message: "Missing query 'q'" } }, { status: 400 });
  }

  if (!sourcesParam) {
    return NextResponse.json({ error: { message: "Missing 'sources' parameter (comma separated)" } }, { status: 400 });
  }

  const sourceIds = sourcesParam.split(",").filter(Boolean);

  const resultsBySource: GlobalSearchResponse["resultsBySource"] = {};

  // Fetch from all selected sources in parallel
  const promises = sourceIds.map(async (sourceId) => {
    let source;
    try {
      source = sourceManager.getSource(sourceId);
    } catch (e) {
      resultsBySource[sourceId] = { results: [], error: "Source not found" };
      return;
    }

    if (!source.capabilities.search) {
      resultsBySource[sourceId] = { results: [], error: "Search not supported by source" };
      return;
    }

    try {
      const searchResult = await source.search(q, 1, Object.keys(filters).length > 0 ? filters : undefined);
      resultsBySource[sourceId] = {
        results: searchResult.mangas,
      };
    } catch (error: unknown) {
      resultsBySource[sourceId] = {
        results: [],
        error: error instanceof Error ? error.message : "Search failed",
      };
    }
  });

  await Promise.allSettled(promises);

  return NextResponse.json({
    data: {
      resultsBySource
    }
  });
}
