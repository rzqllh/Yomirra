import { apiClient } from "@/shared/api-client";
import { useLibraryStore, type LibraryItem } from "@/shared/store/library-store";
import { useUpdateStore, getUpdateKey } from "@/shared/store/update-store";
import type { Chapter } from "@/shared/sources/source-types";

export const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
export const CONCURRENCY_LIMIT = 3;

export interface ScanOptions {
  forceRefresh?: boolean;
  cooldownMs?: number;
  signal?: AbortSignal;
}

export interface ScanError {
  sourceId: string;
  mangaId: string;
  error: string;
}

export interface ScanResult {
  totalScanned: number;
  updatesDetected: number;
  skippedCooldown: number;
  errors: ScanError[];
}

export async function scanLibraryUpdates(options: ScanOptions = {}): Promise<ScanResult> {
  const libraryItems = Object.values(useLibraryStore.getState().items || {});
  const updateItems = useUpdateStore.getState().items || {};
  const cooldown = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const now = Date.now();

  const result: ScanResult = {
    totalScanned: 0,
    updatesDetected: 0,
    skippedCooldown: 0,
    errors: [],
  };

  if (libraryItems.length === 0) {
    return result;
  }

  // Filter items needing scan
  const itemsToScan: LibraryItem[] = [];

  for (const item of libraryItems) {
    if (options.signal?.aborted) break;

    // Check cooldown unless forceRefresh is true
    if (!options.forceRefresh) {
      const key = getUpdateKey(item.sourceId, item.mangaId);
      const existingUpdate = updateItems[key];
      if (existingUpdate?.lastCheckedAt) {
        const lastCheckedTime = Date.parse(existingUpdate.lastCheckedAt);
        if (!isNaN(lastCheckedTime) && now - lastCheckedTime < cooldown) {
          result.skippedCooldown++;
          result.totalScanned++;
          continue;
        }
      }
    }

    itemsToScan.push(item);
  }

  // Helper for bounded concurrency pool
  async function poolWorker(items: LibraryItem[]) {
    for (const item of items) {
      if (options.signal?.aborted) break;

      result.totalScanned++;
      const key = getUpdateKey(item.sourceId, item.mangaId);
      const existingUpdate = updateItems[key];

      try {
        const chapters = await apiClient.getChapters(item.sourceId, item.mangaId, { signal: options.signal });

        if (!chapters || chapters.length === 0) {
          useUpdateStore.getState().upsertUpdate({
            sourceId: item.sourceId,
            mangaId: item.mangaId,
            mangaTitle: item.title,
            coverUrl: item.coverUrl,
            sourceName: item.sourceName,
            lastCheckedAt: new Date().toISOString(),
          });
          continue;
        }

        // Identify latest chapter: prefer highest numeric chapter.number, fall back to first chapter
        const latestChapter: Chapter = chapters.reduce((prev, curr) => {
          if (curr.number > prev.number) return curr;
          return prev;
        }, chapters[0]);

        // Check if this is a new update compared to existing record or library last read
        const isNewChapter =
          !existingUpdate ||
          (existingUpdate.latestChapterId !== latestChapter.id &&
            latestChapter.number > (existingUpdate.latestChapterNumber ?? 0));

        if (isNewChapter) {
          result.updatesDetected++;
        }

        useUpdateStore.getState().upsertUpdate({
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: item.title,
          coverUrl: item.coverUrl,
          sourceName: item.sourceName,
          lastKnownChapterId: item.lastReadChapterId,
          lastKnownChapterTitle: item.lastReadChapterTitle,
          latestChapterId: latestChapter.id,
          latestChapterNumber: latestChapter.number,
          latestChapterTitle: latestChapter.title,
          lastCheckedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        if (err.name === 'AbortError' || options.signal?.aborted) {
          break; // Intentionally aborted
        }

        // Record per-source or per-title failure without failing whole scan
        const errorMsg = err?.message || "Gagal memuat chapter terbaru";
        result.errors.push({
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          error: errorMsg,
        });

        useUpdateStore.getState().upsertUpdate({
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: item.title,
          coverUrl: item.coverUrl,
          sourceName: item.sourceName,
          lastCheckedAt: new Date().toISOString(),
          error: errorMsg,
        });
      }
    }
  }

  // Divide work into CONCURRENCY_LIMIT chunks
  const chunks: LibraryItem[][] = Array.from({ length: CONCURRENCY_LIMIT }, () => []);
  itemsToScan.forEach((item, index) => {
    chunks[index % CONCURRENCY_LIMIT].push(item);
  });

  await Promise.all(chunks.map((chunk) => poolWorker(chunk)));

  return result;
}
