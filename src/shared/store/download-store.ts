import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DownloadStatus = "pending" | "downloading" | "downloaded" | "error";

export interface DownloadItem {
  id: string; // sourceId::mangaId::chapterId
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterTitle: string;
  mangaTitle: string;
  status: DownloadStatus;
  progress: number; // 0-100
  downloadedPages: number;
  totalPages: number;
  error?: string;
  addedAt: string;
}

interface DownloadState {
  downloads: Record<string, DownloadItem>;
  queue: string[]; // List of IDs waiting to be downloaded
  isDownloading: boolean;

  addDownload: (item: Omit<DownloadItem, "id" | "status" | "progress" | "downloadedPages" | "totalPages" | "addedAt">) => void;
  removeDownload: (id: string) => void;
  updateStatus: (id: string, status: DownloadStatus, progress?: number, downloadedPages?: number, totalPages?: number, error?: string) => void;
  processQueue: () => Promise<void>;
  isDownloaded: (sourceId: string, mangaId: string, chapterId: string) => boolean;
}

export const getDownloadId = (sourceId: string, mangaId: string, chapterId: string) => `${sourceId}::${mangaId}::${chapterId}`;
export const CACHE_NAME = "yomirra-chapter-cache-v1";

let queueLock: Promise<void> | null = null;

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      queue: [],
      isDownloading: false,

      addDownload: (item) => {
        const id = getDownloadId(item.sourceId, item.mangaId, item.chapterId);
        const { downloads, queue, processQueue } = get();

        // If already downloaded or in queue, skip
        if (downloads[id] && (downloads[id].status === "downloaded" || downloads[id].status === "downloading" || downloads[id].status === "pending")) {
          return;
        }

        set({
          downloads: {
            ...downloads,
            [id]: {
              ...item,
              id,
              status: "pending",
              progress: 0,
              downloadedPages: 0,
              totalPages: 0,
              addedAt: new Date().toISOString(),
            },
          },
          queue: [...queue, id],
        });

        // Trigger queue processing
        processQueue();
      },

      removeDownload: async (id) => {
        // Remove from state
        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[id];
          return {
            downloads: newDownloads,
            queue: state.queue.filter((qId) => qId !== id),
          };
        });

        // Remove from CacheStorage
        if (typeof caches !== "undefined") {
          try {
            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            const prefix = `/offline-images/${id}/`;
            for (const request of keys) {
              if (request.url.includes(prefix)) {
                await cache.delete(request);
              }
            }
          } catch (e) {
            console.error("Failed to clear cache for", id, e);
          }
        }
      },

      updateStatus: (id, status, progress, downloadedPages, totalPages, error) => {
        set((state) => {
          const item = state.downloads[id];
          if (!item) return state;

          return {
            downloads: {
              ...state.downloads,
              [id]: {
                ...item,
                status,
                progress: progress ?? item.progress,
                downloadedPages: downloadedPages ?? item.downloadedPages,
                totalPages: totalPages ?? item.totalPages,
                error: error ?? item.error,
              },
            },
          };
        });
      },

      isDownloaded: (sourceId, mangaId, chapterId) => {
        const id = getDownloadId(sourceId, mangaId, chapterId);
        return get().downloads[id]?.status === "downloaded";
      },

      processQueue: async () => {
        if (queueLock) return;

        let resolveLock!: () => void;
        queueLock = new Promise<void>((resolve) => {
          resolveLock = resolve;
        });

        try {
          const { queue, isDownloading, downloads, updateStatus } = get();
          
          if (isDownloading || queue.length === 0) return;

          // Take the first item in queue
          const id = queue[0];
          const item = downloads[id];

          if (!item) {
            // Clean up orphaned queue item
            set((state) => ({ queue: state.queue.slice(1) }));
            return;
          }

          set({ isDownloading: true, queue: queue.slice(1) });
          updateStatus(id, "downloading", 0, 0, 0);

          try {
            // 1. Fetch chapter pages from API
            const res = await fetch(`/api/sources/${item.sourceId}/manga/${encodeURIComponent(item.mangaId)}/chapters/${encodeURIComponent(item.chapterId)}/pages`);
            if (!res.ok) throw new Error("Failed to fetch chapter details");
            const result = await res.json();
            const pages: { index: number; url: string }[] = result.data?.pages ?? [];

            if (!pages || pages.length === 0) throw new Error("No pages found");

            updateStatus(id, "downloading", 0, 0, pages.length);

            const cache = await caches.open(CACHE_NAME);
            
            let downloaded = 0;
            
            // 2. Download and cache each page
            // To not overwhelm the browser/API, we do it in smaller batches or sequentially.
            // We'll do a concurrency of 3
            const CONCURRENCY = 3;
            
            for (let i = 0; i < pages.length; i += CONCURRENCY) {
              const batch = pages.slice(i, i + CONCURRENCY);
              const promises = batch.map(async (pageObj, idx) => {
                const pageNumber = i + idx;
                // We create a predictable URL format for the cache key:
                // /offline-images/[sourceId::mangaId::chapterId]/[pageIndex]
                const cacheKey = new URL(`/offline-images/${id}/${pageNumber}`, window.location.origin).toString();
                
                // We route the image request through our proxy to avoid CORS and get the actual blob
                const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(pageObj.url)}&sourceId=${item.sourceId}`;
                
                try {
                  const imgRes = await fetch(proxyUrl);
                  if (!imgRes.ok) throw new Error("Image proxy failed");
                  
                  await cache.put(cacheKey, imgRes);
                  
                  downloaded++;
                  const progress = Math.round((downloaded / pages.length) * 100);
                  updateStatus(id, "downloading", progress, downloaded, pages.length);
                } catch (err) {
                  console.error(`Failed to download page ${pageNumber} for ${id}:`, err);
                  throw err;
                }
              });

              await Promise.all(promises);
            }

            // Success
            updateStatus(id, "downloaded", 100, downloaded, pages.length);
          } catch (error: unknown) {
            updateStatus(id, "error", 0, 0, 0, error instanceof Error ? error.message : "Download failed");
          } finally {
            set({ isDownloading: false });
          }
        } finally {
          queueLock = null;
          resolveLock();
          get().processQueue();
        }
      },
    }),
    {
      name: "yomirra-downloads",
      partialize: (state) => ({ downloads: state.downloads }), // We only persist the downloads state, not the queue/isDownloading flag so it resets on reload
    }
  )
);
