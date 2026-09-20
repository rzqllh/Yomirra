import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushLibraryItem, deleteLibraryItem } from "@/shared/lib/sync-utils";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { toast } from "sonner";

/** A reference to a title on a specific manga provider. */
export type SourceRef = {
  sourceId: string;
  mangaId: string;
  addedAt: number;
  matchConfidence: "CONFIRMED" | "HIGH_CONFIDENCE" | "AMBIGUOUS" | "NO_MATCH";
};

export type LibraryItem = {
  id?: string;                    // SavedTitleId — undefined on V0 items pre-migration
  schemaVersion?: 2;              // marks item as migrated
  primarySourceId?: string;       // active reading provider
  primaryMangaId?: string;        // active reading manga ID
  linkedSources?: SourceRef[];    // alternate / dead providers

  sourceId: string;
  mangaId: string;

  title: string;
  coverUrl?: string;
  author?: string;
  status?: string;
  format?: string;
  sourceName?: string;
  addedAt: string;
  updatedAt: string;
  lastReadChapterId?: string;
  lastReadChapterTitle?: string;
  lastReadAt?: string;
  userRating?: number; // 1-10 rating
  isNsfw?: boolean;
  releaseDay?: number; // 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
};

interface LibraryState {
  items: Record<string, LibraryItem>;
  
  addToLibrary: (item: LibraryItem) => void;
  _setItemLocal: (item: LibraryItem) => void;
  removeFromLibrary: (sourceId: string, mangaId: string) => void;
  toggleLibrary: (item: LibraryItem) => void;
  isInLibrary: (sourceId: string, mangaId: string) => boolean;
  getLibraryItem: (sourceId: string, mangaId: string) => LibraryItem | undefined;
  getLibraryItemById: (savedTitleId: string) => LibraryItem | undefined;
  /** Resolve SavedTitleId for a given sourceId+mangaId pair by scanning linkedSources. */
  resolveBySourceRef: (sourceId: string, mangaId: string) => LibraryItem | undefined;
  /** Relink a title to a new primary source, preserving old source provenance in linkedSources as CONFIRMED. */
  relinkTitle: (
    savedTitleIdOrKey: string,
    newSourceId: string,
    newMangaId: string,
    extra?: { title?: string; coverUrl?: string; author?: string }
  ) => void;
  updateLibraryItem: (sourceId: string, mangaId: string, patch: Partial<LibraryItem>) => void;
  clearLibrary: () => void;
  syncWithCloud: (cloudItems: LibraryItem[]) => void;
}

const getLibraryId = (sourceId: string, mangaId: string) => `${sourceId}::${mangaId}`;

const enforceItemCap = (items: Record<string, LibraryItem>, maxItems = 1000) => {
  const keys = Object.keys(items);
  if (keys.length <= maxItems) return items;
  
  const sortedKeys = keys.sort((a, b) => {
    const timeA = new Date(items[a].updatedAt || items[a].addedAt).getTime();
    const timeB = new Date(items[b].updatedAt || items[b].addedAt).getTime();
    return timeB - timeA; // Descending (newest first)
  });

  const keysToRemove = sortedKeys.slice(maxItems);
  const newItems = { ...items };
  keysToRemove.forEach(key => {
    const [sourceId, mangaId] = key.split("::");
    setTimeout(() => deleteLibraryItem(sourceId, mangaId), 0);
    delete newItems[key];
  });
  
  return newItems;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      items: {},

      addToLibrary: (item) => {
        const previousState = get().items;
        let itemToPush: LibraryItem = item;
        set((state) => {
          if (item.isNsfw === undefined) {
            const source = dynamicSourceRegistry.get(item.sourceId) || sourceRegistry.find(s => s.id === item.sourceId);
            if (source) item.isNsfw = source.isNsfw === true;
            else item.isNsfw = false;
          }
          const legacyId = getLibraryId(item.sourceId, item.mangaId);
          // Check if item already exists to prevent duplicate entries under different keys
          const existingEntry = Object.entries(state.items).find(
            ([k, i]) =>
              k === legacyId ||
              (item.id && (k === item.id || i.id === item.id)) ||
              (i.primarySourceId === item.sourceId && i.primaryMangaId === item.mangaId) ||
              (i.sourceId === item.sourceId && i.mangaId === item.mangaId)
          );

          const existingKey = existingEntry?.[0];
          const existingItem = existingEntry?.[1];

          // Re-use existing ID if present, otherwise generate new SavedTitleId
          const savedTitleId = existingItem?.id || item.id || (crypto.randomUUID ? crypto.randomUUID() : legacyId);
          const existingLinked = existingItem?.linkedSources ?? [];
          const incomingLinked = item.linkedSources ?? [];
          const mergedLinked = [...existingLinked];
          for (const inc of incomingLinked) {
            if (!mergedLinked.some((l) => l.sourceId === inc.sourceId && l.mangaId === inc.mangaId)) {
              mergedLinked.push(inc);
            }
          }

          const enriched: LibraryItem = {
            ...existingItem,
            ...item,
            id: savedTitleId,
            schemaVersion: 2,
            primarySourceId: item.primarySourceId ?? existingItem?.primarySourceId ?? item.sourceId,
            primaryMangaId: item.primaryMangaId ?? existingItem?.primaryMangaId ?? item.mangaId,
            linkedSources: mergedLinked,
          };
          itemToPush = enriched;
          const key = existingKey || enriched.id!;
          return {
            items: enforceItemCap({ ...state.items, [key]: enriched })
          };
        });

        // Async Background sync with rollback
        pushLibraryItem(itemToPush).catch(() => {
          set({ items: previousState });
          toast.error("Gagal menyimpan bookmark ke cloud. Periksa koneksi internet.");
        });
      },

      _setItemLocal: (item) => set((state) => {
        // Use SavedTitleId as key if present, else legacy composite key
        const key = item.id ?? getLibraryId(item.sourceId, item.mangaId);
        return {
          items: enforceItemCap({ ...state.items, [key]: item })
        };
      }),

      removeFromLibrary: (sourceId, mangaId) => {
        const previousState = get().items;
        set((state) => {
          const legacyId = getLibraryId(sourceId, mangaId);
          const newItems = { ...state.items };
          let deleted = false;
          for (const [k, i] of Object.entries(newItems)) {
            if (
              k === legacyId ||
              (i.primarySourceId === sourceId && i.primaryMangaId === mangaId) ||
              (i.sourceId === sourceId && i.mangaId === mangaId)
            ) {
              delete newItems[k];
              deleted = true;
            }
          }
          return deleted ? { items: newItems } : state;
        });

        // Async Background sync with rollback
        deleteLibraryItem(sourceId, mangaId).catch(() => {
          set({ items: previousState });
          toast.error("Gagal menghapus bookmark dari cloud. Periksa koneksi internet.");
        });
      },

      toggleLibrary: (item) => {
        const { isInLibrary, addToLibrary, removeFromLibrary } = get();
        if (isInLibrary(item.sourceId, item.mangaId)) {
          removeFromLibrary(item.sourceId, item.mangaId);
        } else {
          addToLibrary(item);
        }
      },

      isInLibrary: (sourceId, mangaId) => {
        const id = getLibraryId(sourceId, mangaId);
        const items = get().items;
        // Check by legacy key (handles both legacy and Phase 1 migrated items)
        return !!items[id] || Object.values(items).some(
          (i) => i.primarySourceId === sourceId && i.primaryMangaId === mangaId
        );
      },

      getLibraryItem: (sourceId, mangaId) => {
        const id = getLibraryId(sourceId, mangaId);
        const items = get().items;
        return items[id] ?? Object.values(items).find(
          (i) => i.primarySourceId === sourceId && i.primaryMangaId === mangaId
        );
      },

      getLibraryItemById: (savedTitleId) => {
        return get().items[savedTitleId];
      },

      resolveBySourceRef: (sourceId, mangaId) => {
        return Object.values(get().items).find(
          (i) =>
            (i.primarySourceId === sourceId && i.primaryMangaId === mangaId) ||
            i.linkedSources?.some((r) => r.sourceId === sourceId && r.mangaId === mangaId)
        );
      },

      relinkTitle: (savedTitleIdOrKey, newSourceId, newMangaId, extra) => {
        const previousState = get().items;
        let updatedItem: LibraryItem | null = null;

        set((state) => {
          let itemKey = savedTitleIdOrKey;
          let existing = state.items[itemKey];

          if (!existing) {
            const foundEntry = Object.entries(state.items).find(
              ([, i]) =>
                i.id === savedTitleIdOrKey ||
                (i.primarySourceId === newSourceId && i.primaryMangaId === newMangaId) ||
                getLibraryId(i.sourceId, i.mangaId) === savedTitleIdOrKey
            );
            if (foundEntry) {
              itemKey = foundEntry[0];
              existing = foundEntry[1];
            }
          }

          if (!existing) return state;

          const currentPrimarySourceId = existing.primarySourceId ?? existing.sourceId;
          const currentPrimaryMangaId = existing.primaryMangaId ?? existing.mangaId;

          const existingLinked = existing.linkedSources ? [...existing.linkedSources] : [];
          const alreadyLinked = existingLinked.some(
            (s) => s.sourceId === currentPrimarySourceId && s.mangaId === currentPrimaryMangaId
          );

          const newLinked: SourceRef[] = alreadyLinked
            ? existingLinked
            : [
                ...existingLinked,
                {
                  sourceId: currentPrimarySourceId,
                  mangaId: currentPrimaryMangaId,
                  matchConfidence: "CONFIRMED",
                  addedAt: Date.now(),
                },
              ];

          updatedItem = {
            ...existing,
            ...(extra?.title ? { title: extra.title } : {}),
            ...(extra?.coverUrl ? { coverUrl: extra.coverUrl } : {}),
            ...(extra?.author ? { author: extra.author } : {}),
            primarySourceId: newSourceId,
            primaryMangaId: newMangaId,
            linkedSources: newLinked,
            updatedAt: new Date().toISOString(),
          };

          return {
            items: {
              ...state.items,
              [itemKey]: updatedItem,
            },
          };
        });

        if (updatedItem) {
          pushLibraryItem(updatedItem).catch(() => {
            set({ items: previousState });
            toast.error("Gagal memperbarui relink sumber di cloud.");
          });
        }
      },

      updateLibraryItem: (sourceId, mangaId, patch) => {
        const previousState = get().items;
        let updatedItem: LibraryItem | null = null;

        set((state) => {
          const legacyId = getLibraryId(sourceId, mangaId);
          const entry = Object.entries(state.items).find(
            ([k, i]) =>
              k === legacyId ||
              (i.primarySourceId === sourceId && i.primaryMangaId === mangaId) ||
              (i.sourceId === sourceId && i.mangaId === mangaId)
          );
          if (!entry) return state;

          const [itemKey, existing] = entry;

          let isNsfw = existing.isNsfw;
          if (isNsfw === undefined && patch.isNsfw === undefined) {
            const source = dynamicSourceRegistry.get(sourceId) || sourceRegistry.find(s => s.id === sourceId);
            if (source) isNsfw = source.isNsfw === true;
            else isNsfw = false;
          }

          updatedItem = {
            ...existing,
            ...patch,
            isNsfw: patch.isNsfw !== undefined ? patch.isNsfw === true : isNsfw === true,
            updatedAt: new Date().toISOString(),
          };
          return {
            items: {
              ...state.items,
              [itemKey]: updatedItem,
            }
          };
        });

        if (updatedItem) {
          // Async Background sync with rollback
          pushLibraryItem(updatedItem).catch(() => {
            set({ items: previousState });
            // silently fail or toast? Since it's often background updates, maybe no toast needed unless critical
          });
        }
      },

      clearLibrary: () => set({ items: {} }),

      syncWithCloud: (cloudItems) => set((state) => {
        const newItems = { ...state.items };
        let hasChanges = false;
        
        for (const cloudItem of cloudItems) {
          const legacyId = getLibraryId(cloudItem.sourceId, cloudItem.mangaId);
          const localEntry = Object.entries(newItems).find(
            ([k, i]) =>
              (cloudItem.id && (k === cloudItem.id || i.id === cloudItem.id)) ||
              k === legacyId ||
              (i.primarySourceId === cloudItem.sourceId && i.primaryMangaId === cloudItem.mangaId) ||
              (i.sourceId === cloudItem.sourceId && i.mangaId === cloudItem.mangaId)
          );
          
          if (!localEntry) {
            const targetKey = cloudItem.id || legacyId;
            newItems[targetKey] = cloudItem;
            hasChanges = true;
          } else {
            const [localKey, localItem] = localEntry;
            const localTime = new Date(localItem.updatedAt || localItem.addedAt).getTime();
            const cloudTime = new Date(cloudItem.updatedAt || cloudItem.addedAt).getTime();
            
            if (cloudTime > localTime) {
              newItems[localKey] = { ...localItem, ...cloudItem };
              hasChanges = true;
            } else if (localTime > cloudTime) {
              setTimeout(() => pushLibraryItem(localItem), 0);
            }
          }
        }

        // Push any local items that don't exist in the cloud
        const cloudKeys = new Set(cloudItems.map(item => getLibraryId(item.sourceId, item.mangaId)));
        for (const cloudItem of cloudItems) {
          if (cloudItem.id) cloudKeys.add(cloudItem.id);
        }
        for (const [id, localItem] of Object.entries(state.items)) {
          const legacyId = getLibraryId(localItem.sourceId, localItem.mangaId);
          if (!cloudKeys.has(id) && !cloudKeys.has(legacyId) && (!localItem.id || !cloudKeys.has(localItem.id))) {
            setTimeout(() => pushLibraryItem(localItem), 0);
          }
        }

        return hasChanges ? { items: enforceItemCap(newItems) } : state;
      }),
    }),
    {
      name: "yomirra-library",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state?.items) return;
        // Clean up any duplicate items in local storage
        const seen = new Map<string, string>();
        const keysToRemove: string[] = [];
        for (const [key, item] of Object.entries(state.items)) {
          const compKey = `${item.primarySourceId ?? item.sourceId}::${item.primaryMangaId ?? item.mangaId}`;
          if (seen.has(compKey)) {
            const existingKey = seen.get(compKey)!;
            const existing = state.items[existingKey];
            const existingTime = new Date(existing.updatedAt || existing.addedAt).getTime();
            const itemTime = new Date(item.updatedAt || item.addedAt).getTime();
            if (itemTime > existingTime || (item.releaseDay !== undefined && existing.releaseDay === undefined)) {
              keysToRemove.push(existingKey);
              seen.set(compKey, key);
            } else {
              keysToRemove.push(key);
            }
          } else {
            seen.set(compKey, key);
          }
        }
        if (keysToRemove.length > 0) {
          const cleaned = { ...state.items };
          for (const k of keysToRemove) {
            delete cleaned[k];
          }
          state.items = cleaned;
        }
      },
      partialize: (state) => ({
        items: Object.fromEntries(
          Object.entries(state.items).filter(([ , item]) => !item.isNsfw)
        )
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        if (version < 1) {
          // Recovery snapshot written BEFORE the transform so it can be restored on failure.
          try {
            const rawSnapshot = localStorage.getItem("yomirra-library");
            if (rawSnapshot) {
              localStorage.setItem("yomirra-library-v0-recovery", rawSnapshot);
            }
          } catch {
            // localStorage may be unavailable in some SSR contexts
          }

          const state = persistedState as { items?: Record<string, LibraryItem> };
          if (state?.items) {
            const migratedItems: Record<string, LibraryItem> = {};
            for (const [legacyKey, item] of Object.entries(state.items)) {
              // Deterministic: legacy SavedTitleId = sourceId::mangaId
              const savedTitleId = `${item.sourceId}::${item.mangaId}`;
              const enriched: LibraryItem = {
                ...item,
                id: savedTitleId,
                schemaVersion: 2,
                primarySourceId: item.sourceId,
                primaryMangaId: item.mangaId,
                linkedSources: [],
              };
              migratedItems[savedTitleId] = enriched;
              // If legacyKey was somehow different (shouldn't happen), clean up
              if (legacyKey !== savedTitleId) {
                // just use the canonical key
              }
            }
            state.items = migratedItems;
          }

          // Schedule cleanup of recovery snapshot after successful rehydration
          // This runs asynchronously so Zustand finishes committing first
          setTimeout(() => {
            try {
              localStorage.removeItem("yomirra-library-v0-recovery");
            } catch {
              // ignore
            }
          }, 5000);

          return state;
        }
        return persistedState;
      },
    }
  )
);
