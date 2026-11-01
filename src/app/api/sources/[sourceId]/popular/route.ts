export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getRequestReadOptions, loadSourceCatalog, sourceErrorResponse } from "@/server/lib/sources/content-access";
import { sourceManager } from "@/server/lib/sources/source-manager";
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
    const data = await loadSourceCatalog(source, "popular", page, getRequestReadOptions(request));

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const response = sourceErrorResponse(error, sourceId, "search");
    return NextResponse.json(response.body, { status: response.status });
  }
}
