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
  scrollPercent?: number;
  readAt: string;
};

interface HistoryState {
  items: Record<string, HistoryItem>;

  upsertHistory: (item: HistoryItem) => void;
  _setItemLocal: (item: HistoryItem) => void;
  removeHistoryItem: (sourceId: string, mangaId: string, chapterId: string) => void;
  removeMangaHistory: (sourceId: string, mangaId: string) => void;
  clearHistory: () => void;
  getLatestForManga: (sourceId: string, mangaId: string) => HistoryItem | undefined;
  getContinueReading: (limit?: number) => HistoryItem[];
  getHistoryList: () => HistoryItem[];
  markChapterProgress: (sourceId: string, mangaId: string, chapterId: string, pageIndex: number, totalPages: number, scrollPercent?: number) => void;
  syncWithCloud: (cloudItems: HistoryItem[]) => void;
}

const getHistoryId = (sourceId: string, mangaId: string, chapterId: string) => `${sourceId}::${mangaId}::${chapterId}`;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: {},

      upsertHistory: (item) => set((state) => {
        const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
        pushHistoryItem(item); // Background sync
        
        const newItems = { ...state.items, [id]: item };
        const entries = Object.entries(newItems);
        const MAX_HISTORY_ITEMS = 1000;
        
        if (entries.length > MAX_HISTORY_ITEMS) {
          entries.sort((a, b) => new Date(b[1].readAt).getTime() - new Date(a[1].readAt).getTime());
          return { items: Object.fromEntries(entries.slice(0, MAX_HISTORY_ITEMS)) };
        }

        return { items: newItems };
      }),

      _setItemLocal: (item) => set((state) => {
        const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
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

      removeMangaHistory: (sourceId, mangaId) => set((state) => {
        const newItems = { ...state.items };
        let hasChanges = false;
        
        Object.keys(newItems).forEach(key => {
          const item = newItems[key];
          if (item.sourceId === sourceId && item.mangaId === mangaId) {
            delete newItems[key];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          import("@/shared/lib/sync-utils").then(({ deleteMangaHistory }) => {
            deleteMangaHistory(sourceId, mangaId);
          });
        }
        
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

      markChapterProgress: (sourceId, mangaId, chapterId, pageIndex, totalPages, scrollPercent) => set((state) => {
        const id = getHistoryId(sourceId, mangaId, chapterId);
        const existing = state.items[id];
        if (!existing) return state;

        // Phase 2.4: Trigger mark-as-read at 90-95% progress
        let progressPercent = totalPages > 0 ? Math.round((pageIndex / totalPages) * 100) : 0;
        
        // If we also get scroll percent (from vertical reader), use it to determine if we've read >90% of the chapter
        if (scrollPercent !== undefined && scrollPercent > 90) {
          progressPercent = 100;
        } else if (progressPercent > 90) {
          progressPercent = 100;
        }
        
        const updatedItem = {
          ...existing,
          pageIndex,
          totalPages,
          progressPercent,
          scrollPercent: scrollPercent !== undefined ? scrollPercent : existing.scrollPercent,
          readAt: new Date().toISOString(),
        };
        
        pushHistoryItem(updatedItem); // Background sync

        return {
          items: {
            ...state.items,
            [id]: updatedItem
          }
        };
      }),

      syncWithCloud: (cloudItems) => set((state) => {
        const newItems = { ...state.items };
        let hasChanges = false;
        
        for (const cloudItem of cloudItems) {
          const id = getHistoryId(cloudItem.sourceId, cloudItem.mangaId, cloudItem.chapterId);
          const localItem = newItems[id];
          
          if (!localItem) {
            newItems[id] = cloudItem;
            hasChanges = true;
          } else {
            const localTime = new Date(localItem.readAt).getTime();
            const cloudTime = new Date(cloudItem.readAt).getTime();
            
            if (cloudTime > localTime) {
              newItems[id] = cloudItem;
              hasChanges = true;
            } else if (localTime > cloudTime) {
              // Local is newer, push to cloud to sync up
              pushHistoryItem(localItem);
            }
          }
        }

        // Push any local items that don't exist in the cloud
        const cloudIds = new Set(cloudItems.map(item => getHistoryId(item.sourceId, item.mangaId, item.chapterId)));
        for (const [id, localItem] of Object.entries(state.items)) {
          if (!cloudIds.has(id)) {
            pushHistoryItem(localItem);
          }
        }

        return hasChanges ? { items: newItems } : state;
      }),
    }),
    {
      name: "yomirra-history",
    }
  )
);
