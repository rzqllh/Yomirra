export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { assertSourceAccess, getVerifiedRequestReadOptions, sourceErrorResponse } from "@/server/lib/sources/content-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan. Coba lagi nanti." } }, { status: 429, headers: rateLimit.headers });
  }

  try {
    const { sourceId } = await params;
    const source = await sourceManager.getSource(sourceId, request.nextUrl.searchParams.get("manifestUrl"));
    assertSourceAccess(source, await getVerifiedRequestReadOptions(request));
    
    if (!source) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: `Source '${sourceId}' not found` } 
      }, { status: 404 });
    }

    if (!source.capabilities.filters) {
      return NextResponse.json({
        data: { genres: [], formats: [], statuses: [], sorts: [] }
      });
    }

    const filters = await source.getFilters();
    return NextResponse.json({ data: filters });
  } catch (error: unknown) {
    const sourceId = (await params).sourceId;
    const response = sourceErrorResponse(error, sourceId, "search");
    return NextResponse.json(response.body, { status: response.status, headers: response.headers });
  }
}

