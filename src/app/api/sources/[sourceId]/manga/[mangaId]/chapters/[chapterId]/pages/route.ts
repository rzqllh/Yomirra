import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; mangaId: string; chapterId: string }> }
) {
  const { sourceId, chapterId } = await params;

  try {
    const source = sourceManager.getSource(sourceId);
    const cacheKey = `source:${sourceId}:pages:${chapterId}`;

    const data = await swrCache(
      cacheKey,
      () => source.getPages(chapterId),
      CACHE_TTL.PAGES
    );

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "Internal Server Error" },
      { status: (error instanceof Error ? error.message : String(error))?.includes("not found") ? 404 : 500 }
    );
  }
}
