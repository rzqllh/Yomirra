export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getRequestReadOptions, loadSourceChapters, sourceErrorResponse } from "@/server/lib/sources/content-access";
import { sourceManager } from "@/server/lib/sources/source-manager";
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
    const data = await loadSourceChapters(source, mangaId, getRequestReadOptions(request));

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const response = sourceErrorResponse(error, sourceId, "chapters");
    return NextResponse.json(response.body, { status: response.status });
  }
}
