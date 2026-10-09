import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "../lib/idb-storage";
import { getDownloadChapterId } from "../utils/download-helpers";
import { deleteDownloadCacheEntries } from "../lib/download-cache";
import { EXPLICIT_DOWNLOADS_CACHE_NAME } from "../lib/pwa-cache-policy";

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
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => void;
  removeDownload: (id: string) => Promise<void>;
  clearDownloads: () => Promise<void>;
  
  // Internal
  _updateDownload: (id: string, updates: Partial<DownloadChapter>) => void;
  _processQueue: () => Promise<void>;
  isDownloaded: (sourceId: string, mangaId: string, chapterId: string) => boolean;
}

export const CACHE_NAME = EXPLICIT_DOWNLOADS_CACHE_NAME;

import { processDownloadQueue, abortControllers, waitForDownloadCompletion } from "../lib/download-engine";

let queueProcessTimer: ReturnType<typeof setTimeout> | null = null;

function clearQueueProcessTimer() {
  if (queueProcessTimer !== null) {
    clearTimeout(queueProcessTimer);
    queueProcessTimer = null;
  }
}

export function isQueueProcessingTimerActive(): boolean {
  return queueProcessTimer !== null;
}

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
        set((state) => {
          const nextQueue = state.queue.filter(q => q !== id);
          if (nextQueue.length === 0) {
            clearQueueProcessTimer();
          }
          return {
            downloads: {
              ...state.downloads,
              [id]: { ...state.downloads[id], status: "paused", updatedAt: Date.now() }
            },
            queue: nextQueue,
            activeDownloads: state.activeDownloads.filter(a => a !== id)
          };
        });
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

      cancelDownload: async (id) => {
        if (abortControllers[id]) {
          abortControllers[id].abort();
        }

        set((state) => {
          const nextQueue = state.queue.filter(q => q !== id);
          if (nextQueue.length === 0) {
            clearQueueProcessTimer();
          }
          return {
            queue: nextQueue,
          };
        });

        await waitForDownloadCompletion(id);
        await deleteDownloadCacheEntries(id);

        set((state) => {
          const item = state.downloads[id];
          if (!item) {
            return {
              activeDownloads: state.activeDownloads.filter(a => a !== id),
            };
          }

          return {
            downloads: {
              ...state.downloads,
              [id]: {
                ...item,
                status: "failed",
                error: "Dibatalkan pengguna",
                progress: 0,
                downloadedPages: 0,
                pages: item.pages.map((page) => ({
                  ...page,
                  status: "pending" as const,
                  contentType: undefined,
                  sizeBytes: undefined,
                })),
                updatedAt: Date.now(),
              },
            },
            activeDownloads: state.activeDownloads.filter(a => a !== id),
          };
        });

        get()._processQueue();
      },

      retryDownload: (id) => {
        get().resumeDownload(id);
      },

      removeDownload: async (id) => {
        if (abortControllers[id]) {
          abortControllers[id].abort();
        }

        set((state) => ({
          queue: state.queue.filter((qId) => qId !== id),
        }));

        await waitForDownloadCompletion(id);
        await deleteDownloadCacheEntries(id);

        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[id];
          return {
            downloads: newDownloads,
            activeDownloads: state.activeDownloads.filter(a => a !== id),
          };
        });

        get()._processQueue();
      },

      clearDownloads: async () => {
        clearQueueProcessTimer();
        const activeIds = Object.keys(abortControllers);
        Object.values(abortControllers).forEach(controller => controller.abort());

        set({ queue: [] });

        await Promise.all(activeIds.map((id) => waitForDownloadCompletion(id)));

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
        clearQueueProcessTimer();
        await processDownloadQueue({
          getDownloads: () => get().downloads,
          getQueue: () => get().queue,
          getActiveDownloads: () => get().activeDownloads,
          getMaxConcurrency: () => get().maxConcurrency,
          setQueue: (q) => set({ queue: q }),
          setActiveDownloads: (a) => set({ activeDownloads: a }),
          updateDownload: get()._updateDownload,
          onProcessComplete: () => {
            const { queue, activeDownloads, maxConcurrency } = get();
            if (queue.length > 0 && activeDownloads.length < maxConcurrency) {
              clearQueueProcessTimer();
              queueProcessTimer = setTimeout(() => {
                queueProcessTimer = null;
                get()._processQueue();
              }, 50);
            } else {
              clearQueueProcessTimer();
            }
          }
        });
      },
    }),
    {
      name: "yomirra-downloads",
      storage: createJSONStorage(() => idbStorage),
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
