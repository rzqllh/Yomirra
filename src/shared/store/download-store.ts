import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDownloadChapterId } from "../utils/download-helpers";

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'downloaded' | 'failed';
export type DownloadPageStatus = 'pending' | 'downloading' | 'cached' | 'failed';

export interface DownloadPage {
  index: number;
  originalUrl: string;
  offlineUrl: string;
  status: DownloadPageStatus;
  contentType?: string;
  sizeBytes?: number;
}

export interface DownloadChapter {
  id: string; // getDownloadChapterId
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterTitle: string;
  coverUrl?: string;
  status: DownloadStatus;
  progress: number;
  totalPages: number;
  downloadedPages: number;
  pages: DownloadPage[];
  createdAt: number;
  updatedAt: number;
  error?: string;
}

interface DownloadState {
  downloads: Record<string, DownloadChapter>;
  queue: string[];
  activeDownloads: string[];
  maxConcurrency: number;

  addDownload: (item: Omit<DownloadChapter, "id" | "status" | "progress" | "downloadedPages" | "totalPages" | "createdAt" | "updatedAt" | "pages">) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  retryDownload: (id: string) => void;
  removeDownload: (id: string) => Promise<void>;
  removeDownloads: (ids: string[]) => Promise<void>;
  clearDownloads: () => void;

  // Internal
  _updateDownload: (id: string, updates: Partial<DownloadChapter>) => void;
  _processQueue: () => Promise<void>;
  isDownloaded: (sourceId: string, mangaId: string, chapterId: string) => boolean;
}

export const CACHE_NAME = "yomirra-chapter-cache-v1";

import { processDownloadQueue, abortControllers } from "../lib/download-engine";

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      queue: [],
      activeDownloads: [],
      maxConcurrency: 1, // Only 1 chapter at a time, but pages inside can be concurrent

      addDownload: (item) => {
        const id = getDownloadChapterId(item.sourceId, item.mangaId, item.chapterId);
        const { downloads, queue, _processQueue } = get();

        if (downloads[id] && (downloads[id].status === "downloaded" || downloads[id].status === "downloading" || downloads[id].status === "queued")) {
          return;
        }

        set({
          downloads: {
            ...downloads,
            [id]: {
              ...item,
              id,
              status: "queued",
              progress: 0,
              downloadedPages: 0,
              totalPages: 0,
              pages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          },
          queue: [...queue, id],
        });

        _processQueue();
      },

      pauseDownload: (id) => {
        if (abortControllers[id]) {
          abortControllers[id].abort();
          delete abortControllers[id];
        }
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: { ...state.downloads[id], status: "paused", updatedAt: Date.now() }
          },
          queue: state.queue.filter(q => q !== id),
          activeDownloads: state.activeDownloads.filter(a => a !== id)
        }));
        get()._processQueue();
      },

      resumeDownload: (id) => {
        const { downloads, queue, activeDownloads } = get();
        if (!downloads[id] || downloads[id].status === "downloaded" || queue.includes(id) || activeDownloads.includes(id)) return;

        set({
          downloads: {
            ...downloads,
            [id]: { ...downloads[id], status: "queued", updatedAt: Date.now() }
          },
          queue: [...queue, id]
        });
        get()._processQueue();
      },

      cancelDownload: (id) => {
        if (abortControllers[id]) {
          abortControllers[id].abort();
          delete abortControllers[id];
        }
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: { ...state.downloads[id], status: "failed", error: "Dibatalkan pengguna", updatedAt: Date.now() }
          },
          queue: state.queue.filter(q => q !== id),
          activeDownloads: state.activeDownloads.filter(a => a !== id)
        }));
        get()._processQueue();
      },

      retryDownload: (id) => {
        get().resumeDownload(id);
      },

      removeDownloads: async (ids) => {
        const uniqueIds = Array.from(new Set(ids));
        if (uniqueIds.length === 0) return;

        uniqueIds.forEach(id => {
          if (abortControllers[id]) {
            abortControllers[id].abort();
            delete abortControllers[id];
          }
        });

        let failedIds: string[] = [];
        if (typeof caches !== "undefined") {
          try {
            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            const prefixes = uniqueIds.map(id => `/offline-images/${id}/`);

            const matchingRequests = keys.filter(req =>
              prefixes.some(prefix => req.url.includes(prefix))
            );

            await Promise.all(matchingRequests.map(async (req) => {
              try {
                await cache.delete(req);
              } catch {
                const matchedPrefix = prefixes.find(p => req.url.includes(p));
                if (matchedPrefix) {
                  const id = matchedPrefix.split('/')[2];
                  if (!failedIds.includes(id)) failedIds.push(id);
                }
              }
            }));
          } catch {
            console.error("Failed to clear cache for some items");
            failedIds = [...uniqueIds];
          }
        }

        // Update state after attempting cache deletion (only for successful ones)
        const successfulIds = uniqueIds.filter(id => !failedIds.includes(id));
        if (successfulIds.length > 0) {
          set((state) => {
            const newDownloads = { ...state.downloads };
            successfulIds.forEach(id => { delete newDownloads[id]; });
            return {
              downloads: newDownloads,
              queue: state.queue.filter(qId => !successfulIds.includes(qId)),
              activeDownloads: state.activeDownloads.filter(a => !successfulIds.includes(a))
            };
          });
        }

        get()._processQueue();

        if (failedIds.length > 0) {
          throw new Error(`Gagal menghapus cache untuk ${failedIds.length} item.`);
        }
      },

      removeDownload: async (id) => {
        await get().removeDownloads([id]);
      },

      clearDownloads: async () => {
        Object.values(abortControllers).forEach(controller => controller.abort());

        set({
          downloads: {},
          queue: [],
          activeDownloads: []
        });

        if (typeof caches !== "undefined") {
          try {
            await caches.delete(CACHE_NAME);
          } catch (e) {
            console.error("Failed to clear cache", e);
          }
        }
      },

      _updateDownload: (id, updates) => {
        set((state) => {
          const item = state.downloads[id];
          if (!item) return state;
          return {
            downloads: {
              ...state.downloads,
              [id]: { ...item, ...updates, updatedAt: Date.now() }
            }
          };
        });
      },

      isDownloaded: (sourceId, mangaId, chapterId) => {
        const id = getDownloadChapterId(sourceId, mangaId, chapterId);
        return get().downloads[id]?.status === "downloaded";
      },

      _processQueue: async () => {
        processDownloadQueue({
          getDownloads: () => get().downloads,
          getQueue: () => get().queue,
          getActiveDownloads: () => get().activeDownloads,
          getMaxConcurrency: () => get().maxConcurrency,
          setQueue: (q) => set({ queue: q }),
          setActiveDownloads: (a) => set({ activeDownloads: a }),
          updateDownload: get()._updateDownload,
          onProcessComplete: () => {
            if (get().queue.length > 0 || get().activeDownloads.length < get().maxConcurrency) {
              setTimeout(() => get()._processQueue(), 50);
            }
          }
        });
      },
    }),
    {
      name: "yomirra-downloads",
      partialize: (state) => ({ downloads: state.downloads }), // persist only downloads mapping
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset any downloading states to paused on reload
          Object.keys(state.downloads).forEach(id => {
            if (state.downloads[id].status === "downloading" || state.downloads[id].status === "queued") {
              state.downloads[id].status = "paused";
            }
          });
        }
      }
    }
  )
);
