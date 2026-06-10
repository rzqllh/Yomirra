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
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q");
  const sourcesParam = searchParams.get("sources");

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
      const searchResult = await source.search(q, 1);
      resultsBySource[sourceId] = {
        results: searchResult.mangas,
      };
    } catch (error: any) {
      resultsBySource[sourceId] = {
        results: [],
        error: error.message || "Search failed",
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
