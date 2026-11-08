// Rotates unsafe legacy automatic caches after Issue #101 content-policy update.
// The separately named explicit-download cache retains durable user downloads.
export const PWA_CACHE_VERSION = 4;

export const EXPLICIT_DOWNLOADS_CACHE_NAME = "yomirra-chapter-cache-v1";
export const READING_BUFFER_CACHE_NAME = `yomirra-reading-buffer-v${PWA_CACHE_VERSION}`;
export const MANGA_IMAGES_CACHE_NAME = "yomirra-manga-images-v4";
export const MANGA_METADATA_CACHE_NAME = "yomirra-manga-metadata-v4";
export const PAGES_CACHE_NAME = "yomirra-pages-v4";
export const SAFE_OFFLINE_PAGE_HEADER = "x-yomirra-offline-cache";
export const SAFE_OFFLINE_PAGE_SCOPE = "safe-v1";

export const RETIRED_SERWIST_CACHES = new Set(["pages", "pages-rsc", "pages-rsc-prefetch", "others"]);

export function isSafeOfflinePageResponse(response: Response): boolean {
  return response.status === 200 && response.headers.get(SAFE_OFFLINE_PAGE_HEADER) === SAFE_OFFLINE_PAGE_SCOPE &&
    response.headers.get("Content-Type")?.split(";")[0].trim() === "text/html";
}

export const CURRENT_AUTOMATIC_CACHE_NAMES = [
  READING_BUFFER_CACHE_NAME,
  MANGA_IMAGES_CACHE_NAME,
  MANGA_METADATA_CACHE_NAME,
  PAGES_CACHE_NAME,
] as const;

const CURRENT_CACHE_NAMES = new Set<string>([
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  ...CURRENT_AUTOMATIC_CACHE_NAMES,
]);

const SESSION_SENSITIVE_PREFIXES = [
  "/account",
  "/admin",
  "/api/account",
  "/api/admin",
  "/api/auth",
] as const;

const OFFLINE_NAVIGATION_PREFIXES = [
  "/library",
  "/bookmark",
  "/history",
  "/downloads",
  "/settings",
  "/updates",
  "/popular",
  "/search",
  "/sources",
  "/manga",
] as const;

export function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const SOURCE_METADATA_PATH = /^\/api\/sources\/[^/]+\/(?:chapters|popular|latest|manga(?:\/[^/]+(?:\/chapters)?)?)$/;

export function isSafeSourceMetadataRequest(url: URL): boolean {
  const safety = url.searchParams.getAll("hideNsfw");
  return safety.length === 1 && safety[0] === "true" &&
    !url.searchParams.has("manifestUrl") && SOURCE_METADATA_PATH.test(url.pathname);
}

export function isNetworkOnlyApiPath(pathname: string): boolean {
  return pathMatchesPrefix(pathname, "/api");
}

export function isSessionSensitivePath(pathname: string): boolean {
  return SESSION_SENSITIVE_PREFIXES.some((prefix) =>
    pathMatchesPrefix(pathname, prefix)
  );
}

export function isOfflineCacheableNavigationPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (isSessionSensitivePath(pathname)) return false;

  return OFFLINE_NAVIGATION_PREFIXES.some((prefix) =>
    pathMatchesPrefix(pathname, prefix)
  );
}

export function isCurrentAppCacheName(cacheName: string): boolean {
  return CURRENT_CACHE_NAMES.has(cacheName);
}

// Only automatically recreated caches may be evicted. Do not treat every
// yomirra-* cache as disposable: a future user-data cache may be durable.
const AUTOMATIC_CACHE_NAME = /^yomirra-(?:reading-buffer|manga-images|manga-metadata|pages)(?:-v\d+)?$/;

export function isAutomaticAppCacheName(cacheName: string): boolean {
  return AUTOMATIC_CACHE_NAME.test(cacheName);
}

export function isOutdatedAppCacheName(cacheName: string): boolean {
  return RETIRED_SERWIST_CACHES.has(cacheName) ||
    (isAutomaticAppCacheName(cacheName) && !isCurrentAppCacheName(cacheName));
}

export async function cleanupOutdatedAppCaches(
  cacheStorage: Pick<CacheStorage, "keys" | "delete">
): Promise<string[]> {
  const deleted: string[] = [];
  const cacheNames = await cacheStorage.keys();

  for (const cacheName of cacheNames) {
    if (!isOutdatedAppCacheName(cacheName)) continue;
    if (await cacheStorage.delete(cacheName)) {
      deleted.push(cacheName);
    }
  }

  return deleted;
}

export async function clearAutomaticAppCaches(
  cacheStorage: Pick<CacheStorage, "keys" | "delete">
): Promise<string[]> {
  const deleted: string[] = [];
  const cacheNames = await cacheStorage.keys();

  for (const cacheName of cacheNames) {
    if (
      cacheName === EXPLICIT_DOWNLOADS_CACHE_NAME ||
      !isAutomaticAppCacheName(cacheName)
    ) {
      continue;
    }

    if (await cacheStorage.delete(cacheName)) {
      deleted.push(cacheName);
    }
  }

  return deleted;
}
