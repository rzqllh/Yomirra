import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate, ExpirationPlugin } from "serwist";
import {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  MANGA_IMAGES_CACHE_NAME,
  MANGA_METADATA_CACHE_NAME,
  PAGES_CACHE_NAME,
  READING_BUFFER_CACHE_NAME,
  RETIRED_SERWIST_CACHES,
  cleanupOutdatedAppCaches,
  isNetworkOnlyApiPath,
  isOfflineCacheableNavigationPath,
  isSafeOfflinePageResponse,
  isSafeSourceMetadataRequest,
  isSessionSensitivePath,
} from "@/shared/lib/pwa-cache-policy";

import { rasterImageContentType } from "@/shared/lib/raster-image";

function virtualImageCache(cacheName: string) {
  return async ({ request }: { request: Request }): Promise<Response> => {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request.url);
    return response && rasterImageContentType(response) ? response : new Response(null, { status: 404 });
  };
}

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

interface ServiceWorkerActivateEvent {
  waitUntil(promise: Promise<unknown>): void;
}

declare const self: WorkerGlobalScope & {
  addEventListener(
    type: "activate",
    listener: (event: ServiceWorkerActivateEvent) => void
  ): void;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache account/admin/auth surfaces. This rule must stay before defaultCache
    // because @serwist/next also provides page/RSC runtime caching rules.
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && isSessionSensitivePath(url.pathname),
      handler: new NetworkOnly(),
    },
    // Virtual images may be rendered as images or fetched for Blob decoding.
    // A navigation must never turn an entry in user storage into an origin document.
    {
      matcher: ({ request, sameOrigin, url }) => sameOrigin &&
        (url.pathname.startsWith("/offline-images/") || url.pathname.startsWith("/reading-buffer/")) &&
        (request.mode === "navigate" || request.destination === "document" ||
          Boolean(request.headers.get("Accept")?.includes("text/html"))),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/offline-images/"),
      handler: virtualImageCache(EXPLICIT_DOWNLOADS_CACHE_NAME),
    },
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/reading-buffer/"),
      handler: virtualImageCache(READING_BUFFER_CACHE_NAME),
    },
    // We aggressively cache manga pages (via image proxy) for offline reading & bandwidth saving.
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname === "/api/proxy/image",
      handler: new CacheFirst({
        cacheName: MANGA_IMAGES_CACHE_NAME,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response.status === 200 && response.headers.get("Content-Security-Policy") === "sandbox; default-src 'none'"
                ? response : null,
          },
          new ExpirationPlugin({
            maxEntries: 400, // Roughly 10-15 chapters worth of images (balanced for mobile storage)
            maxAgeSeconds: 14 * 24 * 60 * 60, // 14 Days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // The server always filters this explicit scope, even with an adult-content cookie.
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && isSafeSourceMetadataRequest(url),
      handler: new StaleWhileRevalidate({
        cacheName: MANGA_METADATA_CACHE_NAME,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
          }),
        ],
      }),
    },
    // Cookie-dependent responses and health probes must not fall through to Serwist's API cache.
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && isNetworkOnlyApiPath(url.pathname),
      handler: new NetworkOnly(),
    },
    // Cache only the explicit offline navigation surface. Sensitive routes are
    // handled by the NetworkOnly guard above and never fall through to defaultCache.
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        request.mode === "navigate" &&
        isOfflineCacheableNavigationPath(url.pathname),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE_NAME,
        networkTimeoutSeconds: 3, // fallback to cache quickly if offline
        plugins: [
          { cacheWillUpdate: async ({ response }) => isSafeOfflinePageResponse(response) ? response : null },
          new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }),
        ],
      }),
    },
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && (
        request.mode === "navigate" || request.headers.get("RSC") === "1" ||
        Boolean(request.headers.get("Accept")?.includes("text/html"))
      ),
      handler: new NetworkOnly(),
    },
    // Retain the stock asset strategies while disabling unscoped document and catch-all caches.
    ...defaultCache.filter(({ handler }) =>
      !("cacheName" in handler && typeof handler.cacheName === "string" && RETIRED_SERWIST_CACHES.has(handler.cacheName))
    ),
  ],
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOutdatedAppCaches(caches));
});

serwist.addEventListeners();
