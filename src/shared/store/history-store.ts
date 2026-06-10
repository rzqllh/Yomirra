import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushHistoryItem, deleteHistoryItem } from "@/shared/lib/sync-utils";

export type HistoryItem = {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  mangaTitle: string;
  chapterTitle?: string;
  coverUrl?: string;
  sourceName?: string;
  pageIndex?: number;
  totalPages?: number;
  progressPercent?: number;
  readAt: string;
};

interface HistoryState {
  items: Record<string, HistoryItem>;

  upsertHistory: (item: HistoryItem) => void;
  removeHistoryItem: (sourceId: string, mangaId: string, chapterId: string) => void;
  clearHistory: () => void;
  getLatestForManga: (sourceId: string, mangaId: string) => HistoryItem | undefined;
  getContinueReading: (limit?: number) => HistoryItem[];
  getHistoryList: () => HistoryItem[];
  markChapterProgress: (sourceId: string, mangaId: string, chapterId: string, pageIndex: number, totalPages: number) => void;
}

const getHistoryId = (sourceId: string, mangaId: string, chapterId: string) => `${sourceId}::${mangaId}::${chapterId}`;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: {},

      upsertHistory: (item) => set((state) => {
        const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
        pushHistoryItem(item); // Background sync
        return {
          items: {
            ...state.items,
            [id]: item,
          }
        };
      }),

      removeHistoryItem: (sourceId, mangaId, chapterId) => set((state) => {
        const id = getHistoryId(sourceId, mangaId, chapterId);
        const newItems = { ...state.items };
        delete newItems[id];
        deleteHistoryItem(sourceId, mangaId, chapterId); // Background sync
        return { items: newItems };
      }),

      clearHistory: () => set({ items: {} }),

      getLatestForManga: (sourceId, mangaId) => {
        const allItems = Object.values(get().items);
        const mangaHistory = allItems.filter(i => i.sourceId === sourceId && i.mangaId === mangaId);
        
        if (mangaHistory.length === 0) return undefined;
        
        // Sort by readAt descending
        return mangaHistory.sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())[0];
      },

      getContinueReading: (limit) => {
        const allItems = Object.values(get().items);
        
        // Group by manga to only get the latest chapter read for each manga
        const latestPerManga = new Map<string, HistoryItem>();
        
        for (const item of allItems) {
          const key = `${item.sourceId}::${item.mangaId}`;
          const existing = latestPerManga.get(key);
          
          if (!existing || new Date(item.readAt).getTime() > new Date(existing.readAt).getTime()) {
            latestPerManga.set(key, item);
          }
        }
        
        const sorted = Array.from(latestPerManga.values())
          .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime());
          
        return limit ? sorted.slice(0, limit) : sorted;
      },
      
      getHistoryList: () => {
        return Object.values(get().items)
          .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime());
      },

      markChapterProgress: (sourceId, mangaId, chapterId, pageIndex, totalPages) => set((state) => {
        const id = getHistoryId(sourceId, mangaId, chapterId);
        const existing = state.items[id];
        if (!existing) return state;

        const progressPercent = totalPages > 0 ? Math.round((pageIndex / totalPages) * 100) : 0;
        
        const updatedItem = {
          ...existing,
          pageIndex,
          totalPages,
          progressPercent,
          readAt: new Date().toISOString(),
        };
        
        pushHistoryItem(updatedItem); // Background sync

        return {
          items: {
            ...state.items,
            [id]: updatedItem
          }
        };
      })
    }),
    {
      name: "yomirra-history",
    }
  )
);
