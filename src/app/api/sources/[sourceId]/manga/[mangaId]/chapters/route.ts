export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL, getSourceCacheKey } from "@/server/lib/cache/redis-cache";
import { mangaParamsSchema } from "@/server/lib/validation/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; mangaId: string }> }
) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }

  const paramValidation = mangaParamsSchema.safeParse(await params);
  if (!paramValidation.success) {
    return NextResponse.json({ error: { message: "Invalid parameters", details: paramValidation.error.format() } }, { status: 400 });
  }
  const { sourceId, mangaId } = paramValidation.data;

  try {
    const source = await sourceManager.getSource(sourceId, request.nextUrl.searchParams.get("manifestUrl"));
    const cacheKey = getSourceCacheKey(source, "chapters", mangaId);

    const data = await withCache(
      cacheKey,
      () => source.getChapters(mangaId),
      CACHE_TTL.CHAPTERS
    );

    if (Array.isArray(data) && data.length === 0) {
      import("@/shared/logger").then(({ logger }) => {
        logger.warn(`Source ${sourceId} returned 0 chapters for manga ${mangaId}`);
      });
      import("@/server/lib/ops/telegram-notifier").then(({ sendTelegramMessage }) => {
        import("@/server/lib/ops/severity").then(({ AlertSeverity }) => {
          sendTelegramMessage(
            `⚠️ *Scraper Degraded Warning*\nSource: \`${sourceId}\`\nManga: \`${mangaId}\`\nReturned 0 chapters (possible broken selector or CF challenge).`,
            { severity: AlertSeverity.WARNING, sourceId, event: "PARSER_BROKEN" }
          ).catch(() => {});
        });
      });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { message: (error instanceof Error ? error.message : String(error)) || "Internal Server Error" } },
      { status: (error instanceof Error ? error.message : String(error))?.includes("not found") ? 404 : 500 }
    );
  }
}

