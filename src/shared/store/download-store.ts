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

let processingLock = false;
const abortControllers: Record<string, AbortController> = {};

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
        if (processingLock) return;
        processingLock = true;

        try {
          const state = get();
          if (state.activeDownloads.length >= state.maxConcurrency || state.queue.length === 0) return;

          const id = state.queue[0];
          const item = state.downloads[id];

          if (!item || item.status !== "queued") {
            set((s) => ({ queue: s.queue.slice(1) }));
            return;
          }

          set((s) => ({
            queue: s.queue.slice(1),
            activeDownloads: [...s.activeDownloads, id]
          }));
          
          get()._updateDownload(id, { status: "downloading", error: undefined });

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

              get()._updateDownload(id, { pages, totalPages: pages.length });
            }

            const cache = await caches.open(CACHE_NAME);
            const CONCURRENCY = 2; // Batasi 2 koneksi per chapter untuk kestabilan offline
            
            for (let i = 0; i < pages.length; i += CONCURRENCY) {
              if (signal.aborted) throw new Error("Aborted");
              
              const batch = pages.slice(i, i + CONCURRENCY);
              const promises = batch.map(async (pageObj) => {
                if (pageObj.status === 'cached') return;

                const pagesCopy = [...get().downloads[id].pages];
                const pageIdx = pagesCopy.findIndex(p => p.index === pageObj.index);
                if (pageIdx !== -1) pagesCopy[pageIdx] = { ...pagesCopy[pageIdx], status: 'downloading' };
                get()._updateDownload(id, { pages: pagesCopy });

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
                  
                  const pagesDone = [...get().downloads[id].pages];
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
                  
                  get()._updateDownload(id, { 
                    pages: pagesDone, 
                    downloadedPages: downloadedCount,
                    progress 
                  });
                } catch (err) {
                  const pagesErr = [...get().downloads[id].pages];
                  const errIdx = pagesErr.findIndex(p => p.index === pageObj.index);
                  if (errIdx !== -1) pagesErr[errIdx] = { ...pagesErr[errIdx], status: 'failed' };
                  get()._updateDownload(id, { pages: pagesErr });
                  throw err;
                }
              });

              await Promise.all(promises);
            }

            const finalPages = get().downloads[id].pages;
            const allCached = finalPages.every(p => p.status === 'cached');
            
            if (allCached) {
              get()._updateDownload(id, { status: "downloaded", progress: 100 });
            } else {
              throw new Error("Beberapa gambar gagal diunduh");
            }
          } catch (error: any) {
            if (error.name === "AbortError" || error.message === "Aborted") {
              // Handled by pause/cancel
            } else {
              get()._updateDownload(id, { status: "failed", error: error.message || "Gagal mengunduh" });
            }
          } finally {
            delete abortControllers[id];
            set((s) => ({ activeDownloads: s.activeDownloads.filter(a => a !== id) }));
          }
        } finally {
          processingLock = false;
          // Recursively process next
          if (get().queue.length > 0 || get().activeDownloads.length < get().maxConcurrency) {
            setTimeout(() => get()._processQueue(), 50);
          }
        }
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
