export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { verifyImageUrl } from "@/server/lib/sign-proxy-url";
import { logger } from "@/shared/logger";
import { safeFetch } from "@/server/lib/security/outbound-policy";

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB

const ALLOWED_DIRECT_CDN_HOSTS = new Set([
  "content.komiku.me",
  "cdnkomiku.xyz",
]);

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

    const response = await safeFetch(url, { 
      headers,
      maxSize: MAX_IMAGE_SIZE,
      // Abort if the fetch takes too long (e.g. 15s)
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      // If upstream anti-bot/Cloudflare blocks server-side fetch (403)
      // for verified direct CDN image hosts, redirect the browser directly to the signed CDN URL.
      if (response.status === 403) {
        try {
          const parsed = new URL(url);
          if (parsed.protocol === "https:" && ALLOWED_DIRECT_CDN_HOSTS.has(parsed.hostname)) {
            return NextResponse.redirect(url, 307);
          }
        } catch {
          // ignore parsing error and fall through
        }
      }
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
      logger.warn(`Invalid content type for image proxy: ${contentType}`);
      return new NextResponse("Invalid content type", { status: 400 });
    }

    const responseHeaders = new Headers();
    if (contentType) responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    // Stream the response directly instead of buffering in memory
    return new NextResponse(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error("Image proxy error", { error, url });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

