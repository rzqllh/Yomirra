import { NextRequest, NextResponse } from "next/server";
import { verifyImageUrl } from "@/server/lib/image";
import { logger } from "@/shared/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const signature = searchParams.get("sig");
  const referer = searchParams.get("ref") || undefined;

  if (!url || !signature) {
    return new NextResponse("Missing url or sig", { status: 400 });
  }

  // Verify HMAC signature to prevent SSRF
  if (!verifyImageUrl(url, signature, referer)) {
    logger.warn(`Invalid image proxy signature for url: ${url}`);
    return new NextResponse("Forbidden: Invalid signature", { status: 403 });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    };

    if (referer) {
      headers.Referer = referer;
      headers.Origin = new URL(referer).origin;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const contentType = response.headers.get("content-type");
    const arrayBuffer = await response.arrayBuffer();

    const responseHeaders = new Headers();
    if (contentType) responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error("Image proxy error", { error, url });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
