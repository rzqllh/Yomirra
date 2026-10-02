export const PWA_CACHE_VERSION = 2;

export const EXPLICIT_DOWNLOADS_CACHE_NAME = "yomirra-chapter-cache-v1";
export const READING_BUFFER_CACHE_NAME = `yomirra-reading-buffer-v${PWA_CACHE_VERSION}`;
export const MANGA_IMAGES_CACHE_NAME = `yomirra-manga-images-v${PWA_CACHE_VERSION}`;
export const MANGA_METADATA_CACHE_NAME = `yomirra-manga-metadata-v${PWA_CACHE_VERSION}`;
export const PAGES_CACHE_NAME = `yomirra-pages-v${PWA_CACHE_VERSION}`;

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

export function isOutdatedAppCacheName(cacheName: string): boolean {
  return cacheName.startsWith("yomirra-") && !isCurrentAppCacheName(cacheName);
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
      !cacheName.startsWith("yomirra-")
    ) {
      continue;
    }

    if (await cacheStorage.delete(cacheName)) {
      deleted.push(cacheName);
    }
  }

  return deleted;
}
