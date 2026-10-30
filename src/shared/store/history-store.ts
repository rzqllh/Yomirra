import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushHistoryItem, deleteHistoryItem, deleteMangaHistory, PartialHistoryDeletionError } from "@/shared/lib/sync-utils";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { toast } from "sonner";
import { useLibraryStore } from "@/shared/store/library-store";
import { parseChapterNumber } from "@/shared/lib/chapter-parser";
import { compareMilestone, retainHistory } from "@/shared/lib/history-retention";
import { getLocalDataOwnerUid } from "@/shared/lib/local-data-owner";

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
  isCompact?: boolean;
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

const pendingWrites = new Map<string, Promise<void>>();
let resetVersion = 0;
const historyRevisions = new Map<string, number>();
function bumpHistoryRevision(id: string): number {
  const revision = (historyRevisions.get(id) ?? 0) + 1;
  historyRevisions.set(id, revision);
  return revision;
}
type PendingHistoryDeletion = {
  item?: HistoryItem;
  revision: number;
  pending: number;
  committed: boolean;
  ownerUid: string | null;
  resetVersion: number;
};
const pendingHistoryDeletions = new Map<string, PendingHistoryDeletion>();
function beginHistoryDeletion(id: string, item: HistoryItem | undefined, ownerUid: string | null): PendingHistoryDeletion {
  let deletion = pendingHistoryDeletions.get(id);
  if (item || !deletion || deletion.revision !== historyRevisions.get(id) || deletion.ownerUid !== ownerUid || deletion.resetVersion !== resetVersion) {
    deletion = { item, revision: 0, pending: 0, committed: false, ownerUid, resetVersion };
  }
  deletion.revision = bumpHistoryRevision(id);
  deletion.pending++;
  pendingHistoryDeletions.set(id, deletion);
  return deletion;
}
function settleHistoryDeletion(id: string, deletion: PendingHistoryDeletion, committed: boolean): HistoryItem | undefined {
  deletion.pending--;
  if (committed) deletion.committed = true;
  if (deletion.pending > 0 || pendingHistoryDeletions.get(id) !== deletion) return;
  pendingHistoryDeletions.delete(id);
  // Overlapping deletes share a snapshot until all results are known. Any
  // committed deletion wins; newer reading progress invalidates the snapshot.
  if (!deletion.committed && deletion.ownerUid === getLocalDataOwnerUid() && deletion.resetVersion === resetVersion && deletion.revision === historyRevisions.get(id)) {
    return deletion.item;
  }
}
const progressTimers = new Map<string, { timer: ReturnType<typeof setTimeout>; startedAt: number; item: HistoryItem }>();
function scheduleProgressWrite(item: HistoryItem): void {
  const key = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
  const previous = progressTimers.get(key);
  if (previous) clearTimeout(previous.timer);
  const ownerUid = getLocalDataOwnerUid();
  const startedAt = previous?.startedAt ?? Date.now();
  const timer = setTimeout(() => {
    progressTimers.delete(key);
    if (getLocalDataOwnerUid() === ownerUid) queueHistoryWrite(item);
  }, Math.max(0, Math.min(1500, 5000 - (Date.now() - startedAt))));
  progressTimers.set(key, { timer, startedAt, item });
}
if (typeof window !== "undefined") window.addEventListener("pagehide", () => {
  for (const pending of progressTimers.values()) {
    clearTimeout(pending.timer);
    queueHistoryWrite(pending.item);
  }
  progressTimers.clear();
});
function queueHistoryWrite(item: HistoryItem): void {
  const ownerUid = getLocalDataOwnerUid();
  if (!ownerUid) return;
  const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
  const key = `${ownerUid}:${id}`;
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => {
    if (getLocalDataOwnerUid() !== ownerUid) return;
    const latest = useHistoryStore.getState().items[id];
    if (latest) await pushHistoryItem(latest, ownerUid);
  });
  pendingWrites.set(key, current);
  void current.then(
    () => { if (pendingWrites.get(key) === current) pendingWrites.delete(key); },
    () => {
      if (pendingWrites.get(key) === current) pendingWrites.delete(key);
      if (getLocalDataOwnerUid() === ownerUid) toast.warning("Progres tersimpan di perangkat", {
        description: "Belum tersinkron ke akun. Sinkronisasi akan dicoba saat koneksi kembali.",
      });
    },
  );
}

/**
 * A visit alone has a chapter index, but no measured page progress.
 * Preserve legacy stored Library milestones until a reviewed migration exists;
 * those historical records may predate verified-progress enforcement.
 */
function hasObservedReadingProgress(item: HistoryItem): boolean {
  return (item.progressPercent ?? 0) > 0 || (item.pageIndex ?? 0) > 0;
}

/**
 * Only genuine page progress may advance a saved Library milestone. Compare
 * chapter numbers where possible and use source-local ordering as a fallback;
 * never infer progress across an unverified alternate-source mapping.
 */
function promoteVerifiedLibraryMilestone(item: HistoryItem): void {
  if (!hasObservedReadingProgress(item)) return;
  const library = useLibraryStore.getState();
  const saved = library.getLibraryItem(item.sourceId, item.mangaId);
  if (!saved || saved.highestMilestoneChapterId === item.chapterId) return;

  const primarySourceId = saved.primarySourceId ?? saved.sourceId;
  if (primarySourceId !== item.sourceId) return;

  if (saved.highestMilestoneChapterId) {
    const currentNumber = item.chapterNumber ?? parseChapterNumber(item.chapterTitle ?? item.chapterId);
    const highestNumber = parseChapterNumber(saved.highestMilestoneChapterTitle ?? saved.highestMilestoneChapterId);
    if (currentNumber !== null && highestNumber !== null) {
      if (currentNumber <= highestNumber) return;
    } else if (item.chapterIndex !== undefined && saved.highestMilestoneIndex !== undefined) {
      if (item.chapterIndex <= saved.highestMilestoneIndex) return;
    } else {
      // No validated ordering; retain prior progress without guessing.
      return;
    }
  }

  library.updateLibraryItem(item.sourceId, item.mangaId, {
    highestMilestoneChapterId: item.chapterId,
    highestMilestoneChapterTitle: item.chapterTitle,
    // Clear any old ordinal when the new chapter lacks a comparable index.
    highestMilestoneIndex: item.chapterIndex,
  });
}

function chooseReadingMilestone(items: HistoryItem[]): HistoryItem | undefined {
  if (items.length === 0) return undefined;
  const library = useLibraryStore.getState();
  const observed = items.filter((item) =>
    hasObservedReadingProgress(item) ||
    library.getLibraryItem(item.sourceId, item.mangaId)?.highestMilestoneChapterId === item.chapterId
  );
  if (observed.length === 0) return undefined;
  return observed.reduce((best, item) => {
    const order = compareMilestone(item, best);
    return order > 0 || (order === 0 && item.readAt > best.readAt) ? item : best;
  });
}

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

        queueHistoryWrite(finalItem);
        return { items: retainHistory({ ...state.items, [id]: { ...finalItem, isCompact: false } }) };
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
          items: retainHistory({
            ...state.items,
            [id]: finalItem,
          })
        };
      }),

      removeHistoryItem: (sourceId, mangaId, chapterId) => {
        const previousState = get().items;
        const ownerUid = getLocalDataOwnerUid();
        const id = getHistoryId(sourceId, mangaId, chapterId);
        const deletion = beginHistoryDeletion(id, previousState[id], ownerUid);
        set((state) => {
          const id = getHistoryId(sourceId, mangaId, chapterId);
          const newItems = { ...state.items };
          delete newItems[id];
          return { items: newItems };
        });

        void deleteHistoryItem(sourceId, mangaId, chapterId, ownerUid).then(() => {
          settleHistoryDeletion(id, deletion, true);
        }, () => {
          const removedItem = settleHistoryDeletion(id, deletion, false);
          if (!removedItem) return;
          set((state) => {
            if (state.items[id]) return {};
            bumpHistoryRevision(id);
            return { items: retainHistory({ ...state.items, [id]: removedItem }) };
          });
          toast.error("Gagal Menghapus Riwayat", {
            description: "Riwayat bacaan belum berhasil dihapus dari akunmu.",
          });
        });
      },

      removeMangaHistory: (sourceId, mangaId) => {
        const previousState = get().items;
        const ownerUid = getLocalDataOwnerUid();
        const mutationResetVersion = resetVersion;
        const prefix = `${sourceId}::${mangaId}::`;
        const affectedIds = new Set(Object.keys(previousState).filter(key => key.startsWith(prefix)));
        // Pending deletes may already have removed their entries from local state.
        for (const key of pendingHistoryDeletions.keys()) {
          if (key.startsWith(prefix)) affectedIds.add(key);
        }
        const deletions = new Map<string, PendingHistoryDeletion>(Array.from(affectedIds, key => [key, beginHistoryDeletion(key, previousState[key], ownerUid)]));
        set((state) => {
          const newItems = { ...state.items };
          Object.keys(newItems).forEach(key => {
            if (key.startsWith(prefix)) {
              delete newItems[key];
            }
          });
          return { items: newItems };
        });

        void deleteMangaHistory(sourceId, mangaId, ownerUid).then(() => {
          for (const [key, deletion] of deletions) settleHistoryDeletion(key, deletion, true);
        }, (error) => {
          const committedChapterIds = new Set(error instanceof PartialHistoryDeletionError ? error.committedChapterIds : []);
          const rollbackItems = new Map<string, HistoryItem>();
          for (const [key, deletion] of deletions) {
            const item = settleHistoryDeletion(key, deletion, committedChapterIds.has(key.slice(prefix.length)));
            if (item) rollbackItems.set(key, item);
          }
          if (getLocalDataOwnerUid() !== ownerUid || mutationResetVersion !== resetVersion) return;
          set((state) => {
            const restored = { ...state.items };
            for (const [key, item] of rollbackItems) {
              if (restored[key]) continue;
              restored[key] = item;
              bumpHistoryRevision(key);
            }
            return { items: retainHistory(restored) };
          });
          toast.error(error instanceof PartialHistoryDeletionError ? "Sebagian Riwayat Berhasil Dihapus" : "Gagal Menghapus Riwayat", {
            description: error instanceof PartialHistoryDeletionError
              ? "Sebagian chapter sudah terhapus di cloud. Coba hapus kembali riwayat yang masih tersisa."
              : "Riwayat komik belum berhasil dihapus dari akunmu.",
          });
        });
      },

      clearHistory: () => {
        resetVersion++;
        historyRevisions.clear();
        pendingHistoryDeletions.clear();
        for (const pending of progressTimers.values()) clearTimeout(pending.timer);
        progressTimers.clear();
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
        
        return chooseReadingMilestone(mangaHistory);
      },

      getContinueReading: (limit) => {
        const allItems = Object.values(get().items);
        
        // Sort titles by recent activity, but use *observed* chapter progress
        // for the continue target. A jump into a far-ahead chapter is not enough.
        const grouped = new Map<string, { items: HistoryItem[]; latestActivity: number }>();
        for (const item of allItems) {
          const key = item.savedTitleId ?? get().resolveSavedTitleId(item.sourceId, item.mangaId) ?? `${item.sourceId}::${item.mangaId}`;
          const group = grouped.get(key);
          if (group) {
            group.items.push(item);
            group.latestActivity = Math.max(group.latestActivity, item.readAt);
          } else {
            grouped.set(key, { items: [item], latestActivity: item.readAt });
          }
        }
        const sorted = Array.from(grouped.values())
          .sort((a, b) => b.latestActivity - a.latestActivity)
          .map((group) =>
            chooseReadingMilestone(group.items) ??
            [...group.items].sort((a, b) => b.readAt - a.readAt)[0]
          );
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
          items: retainHistory({
            ...previousState,
            [getHistoryId(sourceId, mangaId, chapterId)]: { ...updatedItem, isCompact: false }
          })
        });
        queueHistoryWrite(updatedItem);
        promoteVerifiedLibraryMilestone(updatedItem);
      },

      saveProgress: (sourceId, mangaId, chapterId, pageIndex, pageOffset) => {
        set((state) => {
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

        scheduleProgressWrite(updatedItem);
        
        return {
          items: retainHistory({
            ...state.items,
            [id]: { ...updatedItem, isCompact: false }
          })
        };
        });
        const saved = get().items[getHistoryId(sourceId, mangaId, chapterId)];
        if (saved) promoteVerifiedLibraryMilestone(saved);
      },

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
            bumpHistoryRevision(id);
            newItems[id] = cloudItem;
            hasChanges = true;
          } else {
            const localTime = localItem.readAt;
            const cloudTime = cloudItem.readAt;
            
            if (cloudTime > localTime) {
              bumpHistoryRevision(id);
              newItems[id] = cloudItem;
              hasChanges = true;
            } else if (localTime > cloudTime) {
              // Local is newer, push to cloud to sync up
              queueHistoryWrite(localItem);
            }
          }
        }

        // Push any local items that don't exist in the cloud
        const cloudIds = new Set(cloudItems.map(item => getHistoryId(item.sourceId, item.mangaId, item.chapterId)));
        for (const [id, localItem] of Object.entries(state.items)) {
          if (!cloudIds.has(id)) {
            queueHistoryWrite(localItem);
          }
        }

        return hasChanges ? { items: retainHistory(newItems) } : state;
      }),
    }),
    {
      name: "yomirra-history",
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) state.items = retainHistory(state.items);
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        items: retainHistory(Object.fromEntries(
          Object.entries(state.items).filter(([ , item]) => !item.isNsfw)
        ))
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
          return { ...state, items: retainHistory(state.items ?? {}) };
        }
        return { ...persistedState, items: retainHistory(persistedState.items ?? {}) };
      }
    }
  )
);
