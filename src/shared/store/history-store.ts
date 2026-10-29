import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushHistoryItem, deleteHistoryItem, deleteMangaHistory } from "@/shared/lib/sync-utils";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { toast } from "sonner";
import { useLibraryStore } from "@/shared/store/library-store";
import { parseChapterNumber } from "@/shared/lib/chapter-parser";

export type HistoryItem = {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  mangaTitle: string;
  chapterTitle?: string;
  coverUrl?: string;
  sourceName?: string;
  pageIndex?: number;
  pageOffset?: number;
  totalPages?: number;
  progressPercent?: number; // Page-level progress inside a chapter
  seriesProgressPercent?: number; // Series-level progress across all chapters
  chapterIndex?: number; // The current chapter index (0-based)
  totalChapters?: number; // Total chapters available for this manga
  scrollPercent?: number;
  readAt: number;
  isNsfw?: boolean;
  savedTitleId?: string;  // Recoverable via SourceRef lookup if missing
  chapterNumber?: number; // Parsed from chapterTitle for cross-source mapping
  status?: string;        // Publication status: ONGOING | COMPLETED
};

interface HistoryState {
  items: Record<string, HistoryItem>;

  upsertHistory: (item: HistoryItem) => void;
  _setItemLocal: (item: HistoryItem) => void;
  removeHistoryItem: (sourceId: string, mangaId: string, chapterId: string) => void;
  removeMangaHistory: (sourceId: string, mangaId: string) => void;
  clearHistory: () => void;
  getLatestForManga: (sourceId: string, mangaId: string) => HistoryItem | undefined;
  getHighestMilestoneForManga: (sourceId: string, mangaId: string) => HistoryItem | undefined;
  getContinueReading: (limit?: number) => HistoryItem[];
  getHistoryList: () => HistoryItem[];
  markChapterProgress: (sourceId: string, mangaId: string, chapterId: string, pageIndex: number, totalPages: number, scrollPercent?: number) => void;
  saveProgress: (sourceId: string, mangaId: string, chapterId: string, pageIndex: number, pageOffset?: number) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  resolveSavedTitleId: (sourceId: string, mangaId: string) => string | null;
  syncWithCloud: (cloudItems: HistoryItem[]) => void;
}

const getHistoryId = (sourceId: string, mangaId: string, chapterId: string) => `${sourceId}::${mangaId}::${chapterId}`;

// Per-record revisions prevent a failed remote mutation from reverting newer local actions.
const historyRevisions = new Map<string, number>();
let historyClearGeneration = 0;
const bumpHistoryRevision = (id: string): number => {
  const revision = (historyRevisions.get(id) ?? 0) + 1;
  historyRevisions.set(id, revision);
  return revision;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: {},
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      upsertHistory: (item) => set((state) => {
        if (item.isNsfw === undefined) {
          const source = dynamicSourceRegistry.get(item.sourceId) || sourceRegistry.find(s => s.id === item.sourceId);
          if (source) item.isNsfw = source.isNsfw === true;
          else item.isNsfw = false;
        }
        const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
        bumpHistoryRevision(id);
        const existing = state.items[id];
        const savedTitleId = item.savedTitleId ?? get().resolveSavedTitleId(item.sourceId, item.mangaId) ?? undefined;
        if (item.chapterNumber === undefined) {
          const parsedNum = item.chapterTitle ? parseChapterNumber(item.chapterTitle) : (item.chapterId ? parseChapterNumber(item.chapterId) : null);
          if (parsedNum !== null) item.chapterNumber = parsedNum;
        }
        const finalItem = existing
          ? { ...existing, ...item, savedTitleId: savedTitleId ?? existing.savedTitleId, readAt: item.readAt }
          : { ...item, savedTitleId };

        setTimeout(() => pushHistoryItem(finalItem), 0); // Async Background sync
        
        // Reading history is user data, not a cache: never evict and cloud-delete
        // old records simply because the collection exceeds an arbitrary limit.
        const newItems = { ...state.items, [id]: finalItem };

        return { items: newItems };
      }),

      _setItemLocal: (item) => set((state) => {
        const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
        bumpHistoryRevision(id);
        const existing = state.items[id];
        let normalizedReadAt = item.readAt;
        if (typeof normalizedReadAt === 'string') {
          const parsed = new Date(normalizedReadAt).getTime();
          normalizedReadAt = isNaN(parsed) ? Date.now() : parsed;
        } else if (normalizedReadAt && typeof normalizedReadAt === 'object' && 'seconds' in (normalizedReadAt as any)) {
          normalizedReadAt = (normalizedReadAt as any).seconds * 1000;
        }
        const finalItem = existing
          ? { ...existing, ...item, readAt: normalizedReadAt }
          : { ...item, readAt: normalizedReadAt };

        return {
          items: {
            ...state.items,
            [id]: finalItem,
          }
        };
      }),

      removeHistoryItem: (sourceId, mangaId, chapterId) => {
        const id = getHistoryId(sourceId, mangaId, chapterId);
        const previous = get().items[id];
        if (!previous) return;
        const revision = bumpHistoryRevision(id);
        const generation = historyClearGeneration;

        set((state) => {
          const items = { ...state.items };
          delete items[id];
          return { items };
        });

        void deleteHistoryItem(sourceId, mangaId, chapterId).catch(() => {
          let restored = false;
          set((state) => {
            if (generation !== historyClearGeneration ||
                historyRevisions.get(id) !== revision ||
                Object.prototype.hasOwnProperty.call(state.items, id)) return state;
            restored = true;
            bumpHistoryRevision(id);
            return { items: { ...state.items, [id]: previous } };
          });
          if (restored) {
            toast.error("Gagal Menghapus Riwayat", {
              description: "Penghapusan dibatalkan. Perubahan riwayat lainnya tetap aman.",
            });
          }
        });
      },

      removeMangaHistory: (sourceId, mangaId) => {
        const prefix = `${sourceId}::${mangaId}::`;
        const removed = Object.entries(get().items).filter(([key]) => key.startsWith(prefix));
        if (!removed.length) return;
        const revisions = new Map<string, number>(removed.map(([key]): [string, number] => [key, bumpHistoryRevision(key)]));
        const generation = historyClearGeneration;

        set((state) => {
          const items = { ...state.items };
          for (const [key] of removed) delete items[key];
          return { items };
        });

        void deleteMangaHistory(sourceId, mangaId).catch(() => {
          let restored = false;
          set((state) => {
            if (generation !== historyClearGeneration) return state;
            const items = { ...state.items };
            for (const [key, oldItem] of removed) {
              if (historyRevisions.get(key) !== revisions.get(key) ||
                  Object.prototype.hasOwnProperty.call(items, key)) continue;
              items[key] = oldItem;
              bumpHistoryRevision(key);
              restored = true;
            }
            return restored ? { items } : state;
          });
          if (restored) {
            toast.error("Gagal Menghapus Riwayat", {
              description: "Penghapusan dibatalkan tanpa menimpa perubahan bacaan yang lebih baru.",
            });
          }
        });
      },

      clearHistory: () => {
        historyClearGeneration += 1;
        historyRevisions.clear();
        set({ items: {} });
      },

      getLatestForManga: (sourceId, mangaId) => {
        const allItems = Object.values(get().items);
        let mangaHistory = allItems.filter(i => i.sourceId === sourceId && i.mangaId === mangaId);
        
        if (mangaHistory.length === 0) {
          const savedTitleId = get().resolveSavedTitleId(sourceId, mangaId);
          if (savedTitleId) {
            mangaHistory = allItems.filter(i => i.savedTitleId === savedTitleId || get().resolveSavedTitleId(i.sourceId, i.mangaId) === savedTitleId);
          }
        }

        if (mangaHistory.length === 0) return undefined;
        
        // Sort by readAt descending
        return mangaHistory.sort((a, b) => b.readAt - a.readAt)[0];
      },

      getHighestMilestoneForManga: (sourceId, mangaId) => {
        const allItems = Object.values(get().items);
        let mangaHistory = allItems.filter(i => i.sourceId === sourceId && i.mangaId === mangaId);
        
        if (mangaHistory.length === 0) {
          const savedTitleId = get().resolveSavedTitleId(sourceId, mangaId);
          if (savedTitleId) {
            mangaHistory = allItems.filter(i => i.savedTitleId === savedTitleId || get().resolveSavedTitleId(i.sourceId, i.mangaId) === savedTitleId);
          }
        }

        if (mangaHistory.length === 0) return undefined;
        
        // Return item with highest verified milestone (Q52/Q63)
        return [...mangaHistory].sort((a, b) => {
          const aNum = a.chapterNumber ?? (a.chapterTitle ? parseChapterNumber(a.chapterTitle) : null);
          const bNum = b.chapterNumber ?? (b.chapterTitle ? parseChapterNumber(b.chapterTitle) : null);
          if (aNum !== null && bNum !== null) {
            if (bNum !== aNum) return bNum - aNum;
          } else if (bNum !== null && aNum === null) {
            return 1;
          } else if (aNum !== null && bNum === null) {
            return -1;
          }
          if (typeof a.chapterIndex === "number" && typeof b.chapterIndex === "number") {
            if (b.chapterIndex !== a.chapterIndex) return b.chapterIndex - a.chapterIndex;
          }
          if (a.chapterId === b.chapterId) {
            return (b.progressPercent ?? 0) - (a.progressPercent ?? 0);
          }
          return b.readAt - a.readAt;
        })[0];
      },

      getContinueReading: (limit) => {
        const allItems = Object.values(get().items);
        
        // Group by manga to only get the highest milestone chapter read for each manga (Q52)
        const latestPerManga = new Map<string, { milestoneItem: HistoryItem; latestActivity: number }>();
        
        for (const item of allItems) {
          const key = item.savedTitleId ?? get().resolveSavedTitleId(item.sourceId, item.mangaId) ?? `${item.sourceId}::${item.mangaId}`;
          const existing = latestPerManga.get(key);
          
          if (!existing) {
            latestPerManga.set(key, { milestoneItem: item, latestActivity: item.readAt });
          } else {
            const latestActivity = Math.max(existing.latestActivity, item.readAt);
            let isHigherMilestone = false;
            const currentMilestone = existing.milestoneItem;
            
            const itemNum = item.chapterNumber ?? (item.chapterTitle ? parseChapterNumber(item.chapterTitle) : null);
            const curNum = currentMilestone.chapterNumber ?? (currentMilestone.chapterTitle ? parseChapterNumber(currentMilestone.chapterTitle) : null);

            if (itemNum !== null && curNum !== null) {
              isHigherMilestone = itemNum > curNum;
            } else if (typeof item.chapterIndex === "number" && typeof currentMilestone.chapterIndex === "number") {
              isHigherMilestone = item.chapterIndex > currentMilestone.chapterIndex;
            } else if (item.chapterId === currentMilestone.chapterId) {
              isHigherMilestone = (item.progressPercent ?? 0) > (currentMilestone.progressPercent ?? 0);
            } else {
              // Q52: If no semantic order exists, preserve existing verified milestone rather than regressing on readAt
              isHigherMilestone = false;
            }
            
            latestPerManga.set(key, {
              milestoneItem: isHigherMilestone ? item : currentMilestone,
              latestActivity,
            });
          }
        }
        
        const sorted = Array.from(latestPerManga.values())
          .sort((a, b) => b.latestActivity - a.latestActivity)
          .map(entry => entry.milestoneItem);
          
        return limit ? sorted.slice(0, limit) : sorted;
      },
      
      getHistoryList: () => {
        const toTimestamp = (val: unknown) => {
          if (typeof val === 'number' && !isNaN(val)) return val;
          if (typeof val === 'string') {
            const parsed = new Date(val).getTime();
            return isNaN(parsed) ? 0 : parsed;
          }
          if (val && typeof val === 'object' && 'seconds' in (val as any)) {
            return (val as any).seconds * 1000;
          }
          return 0;
        };
        return Object.values(get().items)
          .sort((a, b) => toTimestamp(b.readAt) - toTimestamp(a.readAt));
      },

      markChapterProgress: (sourceId, mangaId, chapterId, pageIndex, totalPages, scrollPercent) => {
        const previousState = get().items;
        const existing = previousState[getHistoryId(sourceId, mangaId, chapterId)];
        if (!existing) return;

        let progressPercent = totalPages > 0 ? Math.round((pageIndex / totalPages) * 100) : 0;
        
        if ((scrollPercent ?? 0) > 90 || progressPercent > 90) {
          progressPercent = 100;
        }
        
        let isNsfw = existing.isNsfw;
        if (isNsfw === undefined) {
          const source = dynamicSourceRegistry.get(sourceId) || sourceRegistry.find(s => s.id === sourceId);
          if (source) isNsfw = source.isNsfw === true;
          else isNsfw = false;
        }
        
        const updatedItem = {
          ...existing,
          pageIndex,
          totalPages,
          progressPercent,
          scrollPercent: scrollPercent !== undefined ? scrollPercent : existing.scrollPercent,
          readAt: Date.now(),
          isNsfw,
        };
        
        bumpHistoryRevision(getHistoryId(sourceId, mangaId, chapterId));
        set({
          items: {
            ...previousState,
            [getHistoryId(sourceId, mangaId, chapterId)]: updatedItem
          }
        });

        pushHistoryItem(updatedItem).catch(() => {
          // Keep local reading progress. Cloud failure must not erase newer local edits.
          toast.warning("Progres Belum Tersimpan", {
            description: "Progres membaca belum tersinkron ke akun karena kendala jaringan.",
          });
        });
      },

      saveProgress: (sourceId, mangaId, chapterId, pageIndex, pageOffset) => set((state) => {
        const id = getHistoryId(sourceId, mangaId, chapterId);
        bumpHistoryRevision(id);
        const existing = state.items[id];
        
        let updatedItem: HistoryItem;
        if (existing) {
          updatedItem = {
            ...existing,
            pageIndex,
            pageOffset,
            readAt: Date.now(),
          };
        } else {
          const anyMangaItem = Object.values(state.items).find(
            (i) => i.sourceId === sourceId && i.mangaId === mangaId
          );
          updatedItem = {
            sourceId,
            mangaId,
            chapterId,
            mangaTitle: anyMangaItem?.mangaTitle || mangaId,
            coverUrl: anyMangaItem?.coverUrl,
            sourceName: anyMangaItem?.sourceName || sourceId,
            savedTitleId: get().resolveSavedTitleId(sourceId, mangaId) ?? undefined,
            pageIndex,
            pageOffset,
            readAt: Date.now(),
          };
        }

        // Intentionally NOT pushing to cloud to prevent excessive network writes from scroll handler
        // The actual progress will be synced when the user leaves the reader or finishes the chapter
        
        return {
          items: {
            ...state.items,
            [id]: updatedItem
          }
        };
      }),

      resolveSavedTitleId: (sourceId, mangaId) => {
        const anyItem = Object.values(get().items).find(
          (i) => i.sourceId === sourceId && i.mangaId === mangaId
        );
        if (anyItem?.savedTitleId) return anyItem.savedTitleId;

        if (typeof useLibraryStore.persist?.hasHydrated === "function" && !useLibraryStore.persist.hasHydrated()) {
          return null;
        }

        const libraryState = useLibraryStore.getState();
        if (libraryState?.resolveBySourceRef) {
          const match = libraryState.resolveBySourceRef(sourceId, mangaId);
          if (match?.id) return match.id;
        }

        return null;
      },

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
            const localTime = localItem.readAt;
            const cloudTime = cloudItem.readAt;
            
            if (cloudTime > localTime) {
              newItems[id] = cloudItem;
              hasChanges = true;
            } else if (localTime > cloudTime) {
              // Local is newer, push to cloud to sync up
              setTimeout(() => pushHistoryItem(localItem), 0);
            }
          }
        }

        // Push any local items that don't exist in the cloud
        const cloudIds = new Set(cloudItems.map(item => getHistoryId(item.sourceId, item.mangaId, item.chapterId)));
        for (const [id, localItem] of Object.entries(state.items)) {
          if (!cloudIds.has(id)) {
            setTimeout(() => pushHistoryItem(localItem), 0);
          }
        }

        return hasChanges ? { items: newItems } : state;
      }),
    }),
    {
      name: "yomirra-history",
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        items: Object.fromEntries(
          Object.entries(state.items).filter(([ , item]) => !item.isNsfw)
        )
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const state = persistedState;
          if (state.items) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.values(state.items).forEach((item: any) => {
              if (typeof item.readAt === 'string') {
                item.readAt = new Date(item.readAt).getTime();
              }
            });
          }
          return state;
        }
        return persistedState;
      }
    }
  )
);
