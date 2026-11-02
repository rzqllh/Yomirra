/**
 * Yomirra Storage Calculation and Cleanup Utility
 * Calculates exact storage consumed strictly by Yomirra (Reading cache, offline downloads, local state)
 * rather than whole-browser profile quota.
 */

import {
  READING_BUFFER_CACHE_NAME,
  EXPLICIT_DOWNLOADS_CACHE_NAME,
} from "./pwa-cache-policy";

export interface YomirraStorageBreakdown {
  readingCacheMB: number;
  downloadsMB: number;
  localDataMB: number;
  totalYomirraMB: number;
  entryCounts: {
    readingCache: number;
    downloads: number;
  };
}

export async function getYomirraStorageBreakdown(): Promise<YomirraStorageBreakdown> {
  let readingCacheBytes = 0;
  let readingCacheCount = 0;
  let downloadsBytes = 0;
  let downloadsCount = 0;
  let localDataBytes = 0;

  // 1. Calculate localStorage used by Yomirra keys
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("yomirra") || key.startsWith("zustand"))) {
          const val = localStorage.getItem(key) || "";
          localDataBytes += (key.length + val.length) * 2; // UTF-16 approximate bytes
        }
      }
    } catch {
      // Storage access blocked or restricted
    }
  }

  // 2. Calculate CacheStorage used strictly by Yomirra
  if (typeof caches !== "undefined") {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name === EXPLICIT_DOWNLOADS_CACHE_NAME) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          downloadsCount += requests.length;
          // Approximate typical webp manga page ~180KB when content-length is unavailable
          for (const req of requests) {
            const resp = await cache.match(req);
            const cl = resp?.headers.get("content-length");
            downloadsBytes += cl ? parseInt(cl, 10) : 180 * 1024;
          }
        } else if (
          name === READING_BUFFER_CACHE_NAME ||
          name.startsWith("manga-images-cache") ||
          name.startsWith("manga-metadata-cache") ||
          name.startsWith("pages-cache") ||
          name.startsWith("yomirra-")
        ) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          readingCacheCount += requests.length;
          for (const req of requests) {
            const resp = await cache.match(req);
            const cl = resp?.headers.get("content-length");
            readingCacheBytes += cl ? parseInt(cl, 10) : 150 * 1024;
          }
        }
      }
    } catch {
      // CacheStorage unavailable in this environment
    }
  }

  const toMB = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;
  const readingCacheMB = toMB(readingCacheBytes);
  const downloadsMB = toMB(downloadsBytes);
  const localDataMB = toMB(localDataBytes);
  const totalYomirraMB = Math.round((readingCacheMB + downloadsMB + localDataMB) * 10) / 10;

  return {
    readingCacheMB,
    downloadsMB,
    localDataMB,
    totalYomirraMB,
    entryCounts: {
      readingCache: readingCacheCount,
      downloads: downloadsCount,
    },
  };
}

export async function clearAllDownloadsCache(): Promise<number> {
  if (typeof caches === "undefined") return 0;
  try {
    const cache = await caches.open(EXPLICIT_DOWNLOADS_CACHE_NAME);
    const keys = await cache.keys();
    for (const key of keys) {
      await cache.delete(key);
    }
    return keys.length;
  } catch {
    return 0;
  }
}
