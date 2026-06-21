import { DownloadChapter, CACHE_NAME } from "../store/download-store";
import { getOfflineImageUrl } from "../utils/download-helpers";

export const abortControllers: Record<string, AbortController> = {};
export let processingLock = false;

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
  processingLock = true;

  try {
    const { 
      getDownloads, getQueue, getActiveDownloads, getMaxConcurrency, 
      setQueue, setActiveDownloads, updateDownload, onProcessComplete 
    } = options;

    const queue = getQueue();
    const activeDownloads = getActiveDownloads();
    const maxConcurrency = getMaxConcurrency();

    if (activeDownloads.length >= maxConcurrency || queue.length === 0) return;

    const id = queue[0];
    const downloads = getDownloads();
    const item = downloads[id];

    if (!item || item.status !== "queued") {
      setQueue(queue.slice(1));
      return;
    }

    setQueue(queue.slice(1));
    setActiveDownloads([...activeDownloads, id]);
    
    updateDownload(id, { status: "downloading", error: undefined });

    const abortController = new AbortController();
    abortControllers[id] = abortController;
    const signal = abortController.signal;

    try {
      let pages = item.pages;
      
      if (pages.length === 0) {
        const res = await fetch(`/api/sources/${item.sourceId}/manga/${encodeURIComponent(item.mangaId)}/chapters/${encodeURIComponent(item.chapterId)}/pages`, { signal });
        if (!res.ok) throw new Error("Gagal mengambil daftar halaman chapter");
        const result = await res.json();
        const fetchedPages: { index: number; url: string }[] = result.data?.pages ?? [];

        if (!fetchedPages || fetchedPages.length === 0) throw new Error("Halaman tidak ditemukan");

        pages = fetchedPages.map(p => ({
          index: p.index,
          originalUrl: p.url,
          offlineUrl: getOfflineImageUrl({ sourceId: item.sourceId, mangaId: item.mangaId, chapterId: item.chapterId, pageIndex: p.index }),
          status: 'pending'
        }));

        updateDownload(id, { pages, totalPages: pages.length });
      }

      const cache = await caches.open(CACHE_NAME);
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

        await Promise.all(promises);
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
    }
  } finally {
    processingLock = false;
    options.onProcessComplete();
  }
}
