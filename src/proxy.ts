import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { SAFE_OFFLINE_PAGE_HEADER, SAFE_OFFLINE_PAGE_SCOPE } from "@/shared/lib/pwa-cache-policy";
import { CONTENT_PREFERENCE_COOKIE, shouldHideNsfw } from "@/shared/sources/content-policy";

const DYNAMIC_PAGE = /^\/(?:library|manga|search|popular|updates|sources)(?:\/|$)/;

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if ((request.method === "GET" || request.method === "HEAD") && (path === "/" || DYNAMIC_PAGE.test(path))) {
    const admission = await checkRateLimit(request, 240, 60, false, "public-page");
    if (!admission.success) return createRateLimitRejection(admission);
  }

  const response = NextResponse.next();
  // Downloads renders a shared shell. Device-local download records load after hydration.
  const isDownloadsShell = request.nextUrl.pathname === "/downloads";
  if (isDownloadsShell || (shouldHideNsfw(request.cookies.get(CONTENT_PREFERENCE_COOKIE)?.value) &&
      !request.cookies.has("yomirra_dynamic_sources_urls"))) {
    response.headers.set(SAFE_OFFLINE_PAGE_HEADER, SAFE_OFFLINE_PAGE_SCOPE);
  }
  return response;
}

export const config = {
  matcher: [
    "/", "/library/:path*", "/bookmark/:path*", "/history/:path*", "/downloads/:path*",
    "/settings/:path*", "/updates/:path*", "/popular/:path*", "/search/:path*", "/sources/:path*",
    "/manga/:path*",
  ],
};
