import type { DownloadChapter } from "../store/download-store";
import { EXPLICIT_DOWNLOADS_CACHE_NAME } from "./pwa-cache-policy";
import { getOfflineImageUrl } from "../utils/download-helpers";

export const abortControllers: Record<string, AbortController> = {};
export let processingLock = false;

const completionPromises = new Map<string, Promise<void>>();
const completionResolvers = new Map<string, () => void>();

export async function waitForDownloadCompletion(id: string): Promise<void> {
  await (completionPromises.get(id) ?? Promise.resolve());
}

function registerDownloadCompletion(id: string): void {
  let resolveCompletion: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    resolveCompletion = resolve;
  });
  completionPromises.set(id, promise);
  completionResolvers.set(id, () => resolveCompletion?.());
}

function resolveDownloadCompletion(id: string): void {
  completionResolvers.get(id)?.();
  completionResolvers.delete(id);
  completionPromises.delete(id);
}

interface DownloadEngineOptions {
  getDownloads: () => Record<string, DownloadChapter>;
  getQueue: () => string[];
  getActiveDownloads: () => string[];
  getMaxConcurrency: () => number;
  setQueue: (newQueue: string[]) => void;
  setActiveDownloads: (newActive: string[]) => void;
  updateDownload: (id: string, updates: Partial<DownloadChapter>) => void;
  onProcessComplete: () => void;
}

export async function processDownloadQueue(options: DownloadEngineOptions) {
  if (processingLock) return;

  const {
    getDownloads, getQueue, getActiveDownloads, getMaxConcurrency,
    setQueue, setActiveDownloads, updateDownload, onProcessComplete
  } = options;

  const queue = getQueue();
  const activeDownloads = getActiveDownloads();
  const maxConcurrency = getMaxConcurrency();

  if (activeDownloads.length >= maxConcurrency || queue.length === 0) return;

  processingLock = true;
  let didProcessItem = false;

  try {
    const id = queue[0];
    const downloads = getDownloads();
    const item = downloads[id];

    if (!item || item.status !== "queued") {
      setQueue(queue.slice(1));
      didProcessItem = true;
      return;
    }

    didProcessItem = true;
    setQueue(queue.slice(1));
    setActiveDownloads([...activeDownloads, id]);
    registerDownloadCompletion(id);
    
    updateDownload(id, { status: "downloading", error: undefined });

    const abortController = new AbortController();
    abortControllers[id] = abortController;
    const signal = abortController.signal;

    try {
      let pages = item.pages;
      const needsPageRefresh =
        pages.length === 0 ||
        pages.some(
          (p) =>
            p.status !== "cached" &&
            (!p.originalUrl.startsWith("/api/proxy/image") || !p.originalUrl.includes("sig="))
        );
      
      if (needsPageRefresh) {
        const res = await fetch(`/api/sources/${item.sourceId}/manga/${encodeURIComponent(item.mangaId)}/chapters/${encodeURIComponent(item.chapterId)}/pages`, { signal });
        if (!res.ok) throw new Error("Gagal mengambil daftar halaman chapter");
        const result = await res.json();
        const fetchedPages: { index: number; url: string }[] = result.data?.pages ?? [];

        if (!fetchedPages || fetchedPages.length === 0) throw new Error("Halaman tidak ditemukan");

        if (pages.length === 0) {
          pages = fetchedPages.map(p => ({
            index: p.index,
            originalUrl: p.url,
            offlineUrl: getOfflineImageUrl({ sourceId: item.sourceId, mangaId: item.mangaId, chapterId: item.chapterId, pageIndex: p.index }),
            status: 'pending'
          }));
        } else {
          // Upgrade legacy/unsigned URLs while preserving existing cached status and offlineUrls
          pages = pages.map(p => {
            if (p.status === 'cached') return p;
            const fresh = fetchedPages.find(fp => fp.index === p.index);
            return fresh ? { ...p, originalUrl: fresh.url } : p;
          });
        }

        updateDownload(id, { pages, totalPages: pages.length });
      }

      const cache = await caches.open(EXPLICIT_DOWNLOADS_CACHE_NAME);
      const CONCURRENCY = 2; // Batasi 2 koneksi per chapter untuk kestabilan offline
      
      for (let i = 0; i < pages.length; i += CONCURRENCY) {
        if (signal.aborted) throw new Error("Aborted");
        
        const batch = pages.slice(i, i + CONCURRENCY);
        const promises = batch.map(async (pageObj) => {
          if (pageObj.status === 'cached') return;

          const pagesCopy = [...getDownloads()[id].pages];
          const pageIdx = pagesCopy.findIndex(p => p.index === pageObj.index);
          if (pageIdx !== -1) pagesCopy[pageIdx] = { ...pagesCopy[pageIdx], status: 'downloading' };
          updateDownload(id, { pages: pagesCopy });

          const cacheKey = new URL(pageObj.offlineUrl, window.location.origin).toString();
          const proxyUrl = pageObj.originalUrl.startsWith('/api/proxy/image')
            ? pageObj.originalUrl
            : `/api/proxy/image?url=${encodeURIComponent(pageObj.originalUrl)}&sourceId=${item.sourceId}`;
          
          try {
            const imgRes = await fetch(proxyUrl, { signal });
            if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
            
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            if (!contentType.startsWith("image/")) throw new Error("Invalid content type");

            // Clone response before putting in cache
            const cacheRes = imgRes.clone();
            await cache.put(cacheKey, cacheRes);
            
            const blob = await imgRes.blob();
            
            const pagesDone = [...getDownloads()[id].pages];
            const doneIdx = pagesDone.findIndex(p => p.index === pageObj.index);
            if (doneIdx !== -1) {
              pagesDone[doneIdx] = { 
                ...pagesDone[doneIdx], 
                status: 'cached',
                contentType,
                sizeBytes: blob.size
              };
            }
            
            const downloadedCount = pagesDone.filter(p => p.status === 'cached').length;
            const progress = Math.round((downloadedCount / pages.length) * 100);
            
            updateDownload(id, { 
              pages: pagesDone, 
              downloadedPages: downloadedCount,
              progress 
            });
          } catch (err) {
            const pagesErr = [...getDownloads()[id].pages];
            const errIdx = pagesErr.findIndex(p => p.index === pageObj.index);
            if (errIdx !== -1) pagesErr[errIdx] = { ...pagesErr[errIdx], status: 'failed' };
            updateDownload(id, { pages: pagesErr });
            throw err;
          }
        });

        const results = await Promise.allSettled(promises);
        const rejected = results.find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );
        if (rejected) {
          throw rejected.reason;
        }
      }

      const finalPages = getDownloads()[id].pages;
      const allCached = finalPages.every(p => p.status === 'cached');
      
      if (allCached) {
        updateDownload(id, { status: "downloaded", progress: 100 });
      } else {
        throw new Error("Beberapa gambar gagal diunduh");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message === "Aborted") {
          // Handled by pause/cancel
        } else {
          updateDownload(id, { status: "failed", error: error.message || "Gagal mengunduh" });
        }
      } else {
        updateDownload(id, { status: "failed", error: "Gagal mengunduh" });
      }
    } finally {
      delete abortControllers[id];
      setActiveDownloads(getActiveDownloads().filter(a => a !== id));
      resolveDownloadCompletion(id);
    }
  } finally {
    processingLock = false;
    if (didProcessItem) {
      onProcessComplete();
    }
  }
}
