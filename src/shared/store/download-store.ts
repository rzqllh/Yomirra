import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDownloadChapterId, getOfflineImageUrl } from "../utils/download-helpers";

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
  removeDownload: (id: string) => void;
  
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

      removeDownload: async (id) => {
        if (abortControllers[id]) {
          abortControllers[id].abort();
          delete abortControllers[id];
        }
        
        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[id];
          return {
            downloads: newDownloads,
            queue: state.queue.filter((qId) => qId !== id),
            activeDownloads: state.activeDownloads.filter(a => a !== id)
          };
        });

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
        get()._processQueue();
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
