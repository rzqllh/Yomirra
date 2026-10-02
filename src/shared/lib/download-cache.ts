import { EXPLICIT_DOWNLOADS_CACHE_NAME } from "./pwa-cache-policy";

export async function deleteDownloadCacheEntries(
  downloadId: string,
  cacheStorage: CacheStorage | undefined =
    typeof caches === "undefined" ? undefined : caches
): Promise<number> {
  if (!cacheStorage) return 0;

  const cache = await cacheStorage.open(EXPLICIT_DOWNLOADS_CACHE_NAME);
  const keys = await cache.keys();
  const prefix = `/offline-images/${downloadId}/`;
  let deleted = 0;

  for (const request of keys) {
    if (!request.url.includes(prefix)) continue;
    if (await cache.delete(request)) {
      deleted += 1;
    }
  }

  return deleted;
}
