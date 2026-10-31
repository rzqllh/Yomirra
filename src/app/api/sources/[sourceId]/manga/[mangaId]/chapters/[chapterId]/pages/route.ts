export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getRequestReadOptions, loadSourcePages, sourceErrorResponse } from "@/server/lib/sources/content-access";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { chapterParamsSchema } from "@/server/lib/validation/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; mangaId: string; chapterId: string }> }
) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }

  const paramValidation = chapterParamsSchema.safeParse(await params);
  if (!paramValidation.success) {
    return NextResponse.json({ error: { message: "Invalid parameters", details: paramValidation.error.format() } }, { status: 400 });
  }
  const { sourceId, mangaId, chapterId } = paramValidation.data;

  try {
    const source = await sourceManager.getSource(sourceId, request.nextUrl.searchParams.get("manifestUrl"));
    const data = await loadSourcePages(source, mangaId, chapterId, getRequestReadOptions(request));

    // Sign URLs for the proxy
    const { signImageUrl } = await import("@/server/lib/sign-proxy-url");
    const signedData = {
      ...data,
      pages: data.pages.map((p: any) => ({
        ...p,
        url: signImageUrl(p.url, p.referer || source.baseUrl)
      }))
    };

    return NextResponse.json({ data: signedData });
  } catch (error: unknown) {
    const response = sourceErrorResponse(error, sourceId, "pages");
    return NextResponse.json(response.body, { status: response.status });
  }
}
