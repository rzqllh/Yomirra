import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin, CacheOnly } from "serwist";

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
    // We never fetch from network for this virtual route. It's populated by download-store.ts.
    {
      matcher: ({ url }) => url.pathname.startsWith('/offline-images/'),
      handler: new CacheOnly({
        cacheName: 'yomirra-chapter-cache-v1',
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith('/reading-buffer/'),
      handler: new CacheOnly({
        cacheName: 'yomirra-reading-buffer-v1',
      }),
    },
    // We aggressively cache manga pages (via image proxy) for offline reading & bandwidth saving.
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/proxy/image'),
      handler: new CacheFirst({
        cacheName: 'yomirra-manga-images',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1000, // Roughly 20-30 chapters worth of images
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
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
        cacheName: 'yomirra-manga-metadata',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
          }),
        ],
      }),
    },
    // NetworkFirst for dynamic HTML/pages like /library, /browse, /bookmark, /history
    {
      matcher: ({ request, url }) =>
        request.mode === 'navigate' ||
        url.pathname.startsWith('/library') ||
        url.pathname.startsWith('/bookmark') ||
        url.pathname.startsWith('/history') ||
        url.pathname.startsWith('/downloads') ||
        url.pathname.startsWith('/settings'),
      handler: new NetworkFirst({
        cacheName: 'yomirra-pages',
        networkTimeoutSeconds: 3, // fallback to cache quickly if offline
      }),
    },
    // Include default caches for other assets (JS, CSS, static images)
    ...defaultCache,
  ],
});

serwist.addEventListeners();
