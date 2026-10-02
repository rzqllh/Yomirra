/**
 * Reading Buffer and Automatic Cache Management
 *
 * Automatic caches are versioned centrally so service-worker upgrades can discard
 * stale data without touching explicit user downloads.
 */

import {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  READING_BUFFER_CACHE_NAME,
  clearAutomaticAppCaches,
} from "./pwa-cache-policy";

export {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  MANGA_IMAGES_CACHE_NAME,
  MANGA_METADATA_CACHE_NAME,
  READING_BUFFER_CACHE_NAME,
} from "./pwa-cache-policy";

export const MAX_BUFFERED_CHAPTERS = 2;
export const MAX_BUFFER_BYTES = 100 * 1024 * 1024; // 100MB bounded buffer

export interface BufferedChapterMeta {
  chapterKey: string; // `${sourceId}::${mangaId}::${chapterId}`
  sourceId: string;
  mangaId: string;
  chapterId: string;
  pageCount: number;
  bufferedAt: number;
}

const REGISTRY_STORAGE_KEY = "yomirra_reading_buffer_registry_v2";
const LEGACY_REGISTRY_STORAGE_KEYS = ["yomirra_reading_buffer_registry"] as const;

function getRegistry(): BufferedChapterMeta[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegistry(registry: BufferedChapterMeta[]): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore quota issues
  }
}

export function getBufferedPageRequestKey(
  sourceId: string,
  mangaId: string,
  chapterId: string,
  pageIndex: number
): string {
  return `/reading-buffer/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}/${encodeURIComponent(chapterId)}/${pageIndex}`;
}

/**
 * Checks if a chapter has been buffered in the reading buffer.
 */
export async function isChapterBuffered(
  sourceId: string,
  mangaId: string,
  chapterId: string
): Promise<boolean> {
  const chapterKey = `${sourceId}::${mangaId}::${chapterId}`;
  const registry = getRegistry();
  return registry.some((c) => c.chapterKey === chapterKey);
}

/**
 * Buffers a chapter's pages in the automatic reading buffer.
 * Bounded to MAX_BUFFERED_CHAPTERS using LRU eviction.
 * Never caches locked chapters.
 */
export async function bufferChapterPages(params: {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  pages: Array<{ index: number; url: string }>;
  isLocked?: boolean;
}): Promise<number> {
  const { sourceId, mangaId, chapterId, pages, isLocked } = params;

  // Security & Content Safety: Never cache locked/premium chapters
  if (isLocked) {
    return 0;
  }

  if (typeof caches === "undefined" || pages.length === 0) {
    return 0;
  }

  const chapterKey = `${sourceId}::${mangaId}::${chapterId}`;
  const registry = getRegistry();

  // If already buffered recently, update timestamp
  const existingIdx = registry.findIndex((c) => c.chapterKey === chapterKey);
  if (existingIdx !== -1) {
    registry[existingIdx].bufferedAt = Date.now();
    saveRegistry(registry);
    return pages.length;
  }

  // Enforce bounded budget: Evict oldest chapters if >= MAX_BUFFERED_CHAPTERS
  while (registry.length >= MAX_BUFFERED_CHAPTERS) {
    // Sort oldest first
    registry.sort((a, b) => a.bufferedAt - b.bufferedAt);
    const oldest = registry.shift();
    if (oldest) {
      await evictBufferedChapter(oldest.sourceId, oldest.mangaId, oldest.chapterId, oldest.pageCount);
    }
  }

  try {
    const cache = await caches.open(READING_BUFFER_CACHE_NAME);
    let cachedCount = 0;

    // Buffer pages bounded to 3 concurrent fetches
    for (const page of pages) {
      if (!page.url) continue;
      const requestKey = getBufferedPageRequestKey(sourceId, mangaId, chapterId, page.index);

      // Check if already in cache
      const exists = await cache.match(requestKey);
      if (!exists) {
        try {
          const res = await fetch(page.url, { mode: "cors" });
          if (res.ok) {
            await cache.put(requestKey, res.clone());
            cachedCount++;
          }
        } catch {
          // Non-blocking for individual pages
        }
      } else {
        cachedCount++;
      }
    }

    if (cachedCount > 0) {
      registry.push({
        chapterKey,
        sourceId,
        mangaId,
        chapterId,
        pageCount: pages.length,
        bufferedAt: Date.now(),
      });
      saveRegistry(registry);
    }

    return cachedCount;
  } catch {
    return 0;
  }
}

/**
 * Evicts a specific chapter from the reading buffer cache.
 */
export async function evictBufferedChapter(
  sourceId: string,
  mangaId: string,
  chapterId: string,
  pageCount?: number
): Promise<void> {
  if (typeof caches === "undefined") return;

  try {
    const cache = await caches.open(READING_BUFFER_CACHE_NAME);
    const count = pageCount ?? 100;
    for (let i = 0; i < count; i++) {
      const key = getBufferedPageRequestKey(sourceId, mangaId, chapterId, i);
      await cache.delete(key);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Retrieves a buffered page image Blob URL if available in the reading buffer.
 */
export async function getBufferedPageBlobUrl(
  sourceId: string,
  mangaId: string,
  chapterId: string,
  pageIndex: number
): Promise<string | null> {
  if (typeof caches === "undefined") return null;

  try {
    const cache = await caches.open(READING_BUFFER_CACHE_NAME);
    const key = getBufferedPageRequestKey(sourceId, mangaId, chapterId, pageIndex);
    const res = await cache.match(key);
    if (!res) return null;

    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Clears automatic temporary cache (reading buffer, proxy images, metadata)
 * while strictly preserving explicit user downloads (`yomirra-chapter-cache-v1`).
 */
export async function clearAutomaticCache(): Promise<{ clearedCaches: string[]; preserved: string }> {
  if (typeof caches === "undefined") {
    return { clearedCaches: [], preserved: EXPLICIT_DOWNLOADS_CACHE_NAME };
  }

  const clearedCaches = await clearAutomaticAppCaches(caches);

  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorage.removeItem(REGISTRY_STORAGE_KEY);
    for (const key of LEGACY_REGISTRY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }

  return {
    clearedCaches,
    preserved: EXPLICIT_DOWNLOADS_CACHE_NAME,
  };
}

/**
 * Storage quota estimation helper.
 */
export async function getStorageEstimate(): Promise<{
  usageBytes: number;
  quotaBytes: number;
  usageMB: number;
  quotaMB: number;
  percentage: number;
  isQuotaLow: boolean;
}> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageBytes = estimate.usage ?? 0;
      const quotaBytes = estimate.quota ?? 1;
      const percentage = Math.min(100, Math.round((usageBytes / quotaBytes) * 100));
      return {
        usageBytes,
        quotaBytes,
        usageMB: Math.round((usageBytes / (1024 * 1024)) * 10) / 10,
        quotaMB: Math.round(quotaBytes / (1024 * 1024)),
        percentage,
        isQuotaLow: percentage > 85,
      };
    } catch {
      // Fallback
    }
  }

  return {
    usageBytes: 0,
    quotaBytes: 0,
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
    isQuotaLow: false,
  };
}
