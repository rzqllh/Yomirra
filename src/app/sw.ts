import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate, ExpirationPlugin, CacheOnly } from "serwist";
import {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  MANGA_IMAGES_CACHE_NAME,
  MANGA_METADATA_CACHE_NAME,
  PAGES_CACHE_NAME,
  READING_BUFFER_CACHE_NAME,
  cleanupOutdatedAppCaches,
  isOfflineCacheableNavigationPath,
  isSessionSensitivePath,
} from "@/shared/lib/pwa-cache-policy";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

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
    // We never fetch from network for this virtual route. It's populated by download-store.ts.
    {
      matcher: ({ url }) => url.pathname.startsWith('/offline-images/'),
      handler: new CacheOnly({
        cacheName: EXPLICIT_DOWNLOADS_CACHE_NAME,
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith('/reading-buffer/'),
      handler: new CacheOnly({
        cacheName: READING_BUFFER_CACHE_NAME,
      }),
    },
    // We aggressively cache manga pages (via image proxy) for offline reading & bandwidth saving.
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/proxy/image'),
      handler: new CacheFirst({
        cacheName: MANGA_IMAGES_CACHE_NAME,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 400, // Roughly 10-15 chapters worth of images (balanced for mobile storage)
            maxAgeSeconds: 14 * 24 * 60 * 60, // 14 Days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // StaleWhileRevalidate for Source Metadata API
    // Explicit allowlist: only cache manga details and chapter lists.
    // We intentionally exclude /search, /health, /nsfw-ids to prevent cache bloat or stale data.
    {
      matcher: ({ url }) => {
        if (url.pathname.match(/^\/api\/sources\/[^/]+\/(manga|chapters|popular|latest)$/)) return true;
        if (url.pathname.match(/^\/api\/sources\/[^/]+\/manga\/[^/]+$/)) return true;
        if (url.pathname.match(/^\/api\/sources\/[^/]+\/manga\/[^/]+\/chapters$/)) return true;
        return false;
      },
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
      }),
    },
    // Include default caches for other assets (JS, CSS, static images)
    ...defaultCache,
  ],
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOutdatedAppCaches(caches));
});

serwist.addEventListeners();
