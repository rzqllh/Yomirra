import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { paginationSchema, sourceParamsSchema } from "@/server/lib/validation/api";

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
  const queryValidation = paginationSchema.safeParse({ page: searchParams.get("page") });
  if (!queryValidation.success) {
    return NextResponse.json({ error: { message: "Invalid query parameters", details: queryValidation.error.format() } }, { status: 400 });
  }
  const { page } = queryValidation.data;

  try {
    const source = await sourceManager.getSource(sourceId, request.nextUrl.searchParams.get("manifestUrl"));
    const cacheKey = `source:${sourceId}:popular:${page}`;

    const data = await withCache(
      cacheKey,
      () => source.getPopular(page),
      CACHE_TTL.DISCOVERY
    );

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const msg = (error instanceof Error ? error.message : String(error)) || "Internal Server Error";
    const status = msg.includes("not found") ? 404 : msg.toLowerCase().includes("cloudflare") ? 503 : 500;
    return NextResponse.json(
      { error: { message: msg } },
      { status }
    );
  }
}
