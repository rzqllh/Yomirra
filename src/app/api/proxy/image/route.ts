export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { verifyImageUrl } from "@/server/lib/sign-proxy-url";
import { logger } from "@/shared/logger";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { applyRateLimitHeaders, checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_ACTIVE_IMAGES = 16;
let activeImages = 0;

const ALLOWED_DIRECT_CDN_HOSTS = new Set([
  "content.komiku.me",
  "cdnkomiku.xyz",
  "pic.desu.xxx",
  "amz-ch.desu.pics",
]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const signature = searchParams.get("sig");
  const referer = searchParams.get("ref") || undefined;

  if (!url || !signature) {
    return new NextResponse("Missing url or sig", { status: 400 });
  }

  // Verify HMAC signature to prevent SSRF before spending limiter capacity.
  if (!verifyImageUrl(url, signature, referer)) {
    logger.warn(`Invalid image proxy signature for url: ${url}`);
    return new NextResponse("Forbidden: Invalid signature", { status: 403 });
  }

  const rateLimit = await checkRateLimitPolicy(request, "imageProxy");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  const limited = <T extends Response>(response: T) =>
    applyRateLimitHeaders(response, rateLimit);

  if (activeImages >= MAX_ACTIVE_IMAGES) {
    return limited(new NextResponse("Image proxy busy", {
      status: 503,
      headers: { "Retry-After": "2", "Cache-Control": "no-store" },
    }));
  }

  activeImages++;
  const release = () => { activeImages--; };
  let streamOwnsSlot = false;
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15000)]);

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
      signal,
    });

    if (!response.ok) {
      await response.body?.cancel();
      // If upstream anti-bot/Cloudflare blocks server-side fetch (403)
      // for verified direct CDN image hosts, redirect the browser directly to the signed CDN URL.
      if (response.status === 403) {
        try {
          const parsed = new URL(url);
          if (parsed.protocol === "https:" && ALLOWED_DIRECT_CDN_HOSTS.has(parsed.hostname)) {
            return limited(NextResponse.redirect(url, 307));
          }
        } catch {
          // ignore parsing error and fall through
        }
      }
      return limited(new NextResponse("Failed to fetch image", { status: response.status }));
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
      await response.body?.cancel();
      logger.warn(`Invalid content type for image proxy: ${contentType}`);
      return limited(new NextResponse("Invalid content type", { status: 400 }));
    }

    const responseHeaders = new Headers();
    if (contentType) responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    let body: ReadableStream<Uint8Array> | null = null;
    if (response.body) {
      const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
      void response.body.pipeTo(writable, { signal }).then(release, release);
      streamOwnsSlot = true;
      body = readable;
    }
    return limited(new NextResponse(body, {
      status: 200,
      headers: responseHeaders,
    }));
  } catch (error) {
    logger.error("Image proxy error", { error, url });
    return limited(new NextResponse("Internal Server Error", { status: 500 }));
  } finally {
    if (!streamOwnsSlot) release();
  }
}

