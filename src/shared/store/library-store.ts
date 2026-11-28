import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushLibraryItem, deleteLibraryItem } from "@/shared/lib/sync-utils";
import { getLocalDataOwnerUid } from "@/shared/lib/local-data-owner";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { toast } from "sonner";
import { libraryItemKey, librarySourceProgress, reconcileLibraryItem, reconcileStoredLibrary, updateLibrarySourceProgress } from "@/shared/lib/library-identity";
import { canonicalSourceKey, type CanonicalSourceIdentity } from "@/shared/lib/canonical-identity";
import { isOutboxPathEnabled, enqueueLibraryUpsert, enqueueLibraryDelete } from "@/shared/lib/outbox";

/** A reference to a title on a specific manga provider. */
export type SourceRef = {
  sourceId: string;
  mangaId: string;
  addedAt: number;
  matchConfidence: "CONFIRMED" | "HIGH_CONFIDENCE" | "AMBIGUOUS" | "NO_MATCH";
};

export type LibrarySourceProgress = {
  lastReadChapterId?: string;
  lastReadChapterTitle?: string;
  lastReadAt?: string;
  highestMilestoneChapterId?: string;
  highestMilestoneChapterTitle?: string;
  highestMilestoneIndex?: number;
};

export type LibraryItem = LibrarySourceProgress & {
  id?: string;                    // SavedTitleId — undefined on V0 items pre-migration
  canonicalWorkId?: string;
  savedTitleAliases?: string[];
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
  progressBySource?: Record<string, LibrarySourceProgress>;
  userRating?: number; // 1-10 rating
  isBookmarked?: boolean;
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
  attachAlternateSource: (savedTitleId: string, sourceId: string, mangaId: string) => boolean;
  recordVerifiedCatalogIdentity: (workId: string, refs: readonly CanonicalSourceIdentity[]) => void;
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

const itemReferencesSource = (item: LibraryItem, sourceId: string, mangaId: string) =>
  (item.sourceId === sourceId && item.mangaId === mangaId) ||
  (item.primarySourceId === sourceId && item.primaryMangaId === mangaId) ||
  item.linkedSources?.some((ref) => ref.matchConfidence === "CONFIRMED" &&
    ref.sourceId === sourceId && ref.mangaId === mangaId) === true;

// A user's Library is not an evictable cache. Never delete saved records
// or issue remote tombstones merely because the library grew beyond 1,000 items.
const pendingTitleWrites = new Map<string, Promise<void>>();
const titleMutationVersions = new Map<string, number>();
let libraryResetVersion = 0;

type MutationCheckpoint = {
  before: Record<string, LibraryItem>;
  applied: Record<string, LibraryItem>;
  versions: Map<string, number>;
  resetVersion: number;
  ownerUid: string | null;
};

function queueTitleWrite(id: string, operation: () => Promise<void>, aliases: string[] = []): Promise<void> {
  const prefix = id.slice(0, id.indexOf(":") + 1);
  const ids = [id, ...aliases.map(alias => prefix + alias)];
  const previous = ids.flatMap(key => {
    const pending = pendingTitleWrites.get(key);
    return pending ? [pending.catch(() => undefined)] : [];
  });
  const current = Promise.all(previous).then(operation);
  for (const key of ids) pendingTitleWrites.set(key, current);
  const release = () => {
    for (const key of ids) if (pendingTitleWrites.get(key) === current) pendingTitleWrites.delete(key);
  };
  void current.then(
    release,
    release,
  );
  return current;
}

function captureMutation(
  before: Record<string, LibraryItem>,
  applied: Record<string, LibraryItem>
): MutationCheckpoint {
  const versions = new Map<string, number>();
  for (const key of new Set([...Object.keys(before), ...Object.keys(applied)])) {
    if (before[key] !== applied[key]) {
      const version = (titleMutationVersions.get(key) ?? 0) + 1;
      titleMutationVersions.set(key, version);
      versions.set(key, version);
    }
  }
  return {
    before,
    applied,
    versions,
    resetVersion: libraryResetVersion,
    ownerUid: getLocalDataOwnerUid(),
  };
}

function rollbackMutation(
  checkpoint: MutationCheckpoint,
  setItems: (update: (state: LibraryState) => Partial<LibraryState>) => void,
  onlyKeys?: string[]
): boolean {
  if (checkpoint.resetVersion !== libraryResetVersion ||
      checkpoint.ownerUid !== getLocalDataOwnerUid()) return false;
  let rolledBack = false;
  setItems((state) => {
    const supersededMerge = [...checkpoint.versions.keys()].some(key => {
      const item = checkpoint.applied[key];
      return item?.savedTitleAliases?.some(alias => checkpoint.before[alias] && !checkpoint.applied[alias]) &&
        titleMutationVersions.get(key) !== checkpoint.versions.get(key);
    });
    if (supersededMerge) return {};
    const next = { ...state.items };
    for (const [key, version] of checkpoint.versions) {
      if (onlyKeys && !onlyKeys.includes(key)) continue;
      if (titleMutationVersions.get(key) !== version) continue;
      if (state.items[key] !== checkpoint.applied[key]) continue;
      if (checkpoint.before[key] === undefined) delete next[key];
      else next[key] = checkpoint.before[key];
      titleMutationVersions.set(key, version + 1);
      rolledBack = true;
    }
    return rolledBack ? { items: next } : {};
  });
  return rolledBack;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      items: {},

      addToLibrary: (item) => {
        const previousState = get().items;
        const exact = get().getLibraryItem(item.sourceId, item.mangaId);
        if (exact?.canonicalWorkId && item.canonicalWorkId && exact.canonicalWorkId !== item.canonicalWorkId) {
          item = { ...item, canonicalWorkId: exact.canonicalWorkId, linkedSources: exact.linkedSources };
        }
        const legacyId = getLibraryId(item.sourceId, item.mangaId);
        const source = dynamicSourceRegistry.get(item.sourceId) || sourceRegistry.find(s => s.id === item.sourceId);
        const result = reconcileLibraryItem(previousState, {
          ...item,
          id: item.id ?? globalThis.crypto?.randomUUID?.() ?? legacyId,
          isNsfw: item.isNsfw ?? source?.isNsfw === true,
        }, "save");
        const itemToPush = result.item;
        set({ items: result.items });

        const checkpoint = captureMutation(previousState, get().items);

        // Q138 Outbox-First Dark Launch Branch
        if (isOutboxPathEnabled() && !itemToPush.savedTitleAliases?.length) {
          void enqueueLibraryUpsert(itemToPush);
          return;
        }

        void queueTitleWrite(`${checkpoint.ownerUid ?? "guest"}:${itemToPush.id ?? getLibraryId(item.sourceId, item.mangaId)}`, () =>
          pushLibraryItem(itemToPush, checkpoint.ownerUid), itemToPush.savedTitleAliases
        ).catch(() => {
          if (rollbackMutation(checkpoint, set)) {
            toast.error("Gagal Menyimpan ke Akun", {
              description: "Perubahan ini tidak tersinkron. Perubahan Library lainnya tetap aman.",
            });
          }
        });
      },

      _setItemLocal: (item) => set((state) => ({
        items: reconcileLibraryItem(state.items, item, "sync").items,
      })),

      removeFromLibrary: (sourceId, mangaId) => {
        const previousState = get().items;
        const removedItems = Object.entries(previousState).filter(([key, item]) =>
          key === getLibraryId(sourceId, mangaId) ||
          itemReferencesSource(item, sourceId, mangaId)
        );
        if (removedItems.length === 0) return;
        set((state) => {
          const legacyId = getLibraryId(sourceId, mangaId);
          const newItems = { ...state.items };
          let changed = false;
          for (const [k, i] of Object.entries(newItems)) {
            if (
              k === legacyId ||
              itemReferencesSource(i, sourceId, mangaId)
            ) {
              if (i.userRating !== undefined) {
                newItems[k] = { ...i, isBookmarked: false, updatedAt: new Date().toISOString() };
              } else {
                delete newItems[k];
              }
              changed = true;
            }
          }
          return changed ? { items: newItems } : state;
        });

        const checkpoint = captureMutation(previousState, get().items);

        // Q138 Outbox-First Dark Launch Branch
        if (isOutboxPathEnabled()) {
          for (const [key, removedItem] of removedItems) {
            void enqueueLibraryDelete(removedItem.sourceId, removedItem.mangaId, {
              explicitId: removedItem.id ?? key,
            });
          }
          return;
        }

        for (const [key, removedItem] of removedItems) {
          void queueTitleWrite(`${checkpoint.ownerUid ?? "guest"}:${removedItem.id ?? key}`, () =>
            deleteLibraryItem(removedItem.sourceId, removedItem.mangaId, removedItem.id ?? key, checkpoint.ownerUid)
          ).catch(() => {
            if (rollbackMutation(checkpoint, set, [key])) {
              toast.error("Gagal Menghapus dari Akun", {
                description: "Penghapusan komik ini dibatalkan karena sinkronisasi gagal.",
              });
            }
          });
        }
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
        const found = items[id] ?? Object.values(items).find(
          (item) => itemReferencesSource(item, sourceId, mangaId)
        );
        return Boolean(found && found.isBookmarked !== false);
      },

      getLibraryItem: (sourceId, mangaId) => {
        const id = getLibraryId(sourceId, mangaId);
        const items = get().items;
        return items[id] ?? Object.values(items).find(
          (item) => itemReferencesSource(item, sourceId, mangaId)
        );
      },

      getLibraryItemById: (savedTitleId) => {
        return get().items[savedTitleId] ?? Object.values(get().items).find((item) =>
          item.id === savedTitleId || item.savedTitleAliases?.includes(savedTitleId));
      },

      resolveBySourceRef: (sourceId, mangaId) => {
        return Object.values(get().items).find(
          (item) => itemReferencesSource(item, sourceId, mangaId)
        );
      },

      recordVerifiedCatalogIdentity: (workId, refs) => {
        const before = get().items;
        if (!workId || refs.length < 2 || Object.values(before).some(item =>
          refs.some(ref => itemReferencesSource(item, ref.sourceId, ref.mangaId)) &&
          (item.isNsfw || (item.canonicalWorkId && item.canonicalWorkId !== workId)))) return;
        const matches = Object.values(before).filter(item =>
          (item.canonicalWorkId === workId || refs.some(ref => itemReferencesSource(item, ref.sourceId, ref.mangaId))) &&
          (!item.canonicalWorkId || item.canonicalWorkId === workId));
        const item = matches.find(match => match.isBookmarked !== false) ?? matches[0];
        if (!item || (matches.length === 1 && item.canonicalWorkId === workId &&
            refs.every(ref => itemReferencesSource(item, ref.sourceId, ref.mangaId)))) return;
        const now = Date.now();
        const result = reconcileLibraryItem(before, {
          ...item, id: libraryItemKey(item), canonicalWorkId: workId,
          linkedSources: [...(item.linkedSources ?? []), ...refs.map(ref => ({
            ...ref, addedAt: now, matchConfidence: "CONFIRMED" as const,
          }))],
          updatedAt: new Date(now).toISOString(),
        }, "attach");
        set({ items: result.items });
        const checkpoint = captureMutation(before, result.items);
        void queueTitleWrite(`${checkpoint.ownerUid ?? "guest"}:${libraryItemKey(result.item)}`, () =>
          pushLibraryItem(result.item, checkpoint.ownerUid), result.item.savedTitleAliases
        ).catch(() => rollbackMutation(checkpoint, set));
      },

      attachAlternateSource: (savedTitleId, sourceId, mangaId) => {
        const before = get().items;
        const item = get().getLibraryItemById(savedTitleId);
        if (!item || !sourceId || !mangaId) return false;
        const conflictingRef = Object.values(before).some(other => other !== item &&
          itemReferencesSource(other, sourceId, mangaId) &&
          (Boolean(item.isNsfw) !== Boolean(other.isNsfw) ||
            (item.canonicalWorkId && other.canonicalWorkId && item.canonicalWorkId !== other.canonicalWorkId)));
        if (conflictingRef) return false;
        if (itemReferencesSource(item, sourceId, mangaId)) return true;
        const result = reconcileLibraryItem(before, {
          ...item,
          id: libraryItemKey(item),
          linkedSources: [...(item.linkedSources ?? []), { sourceId, mangaId, addedAt: Date.now(), matchConfidence: "CONFIRMED" }],
          updatedAt: new Date().toISOString(),
        }, "attach");
        set({ items: result.items });
        const checkpoint = captureMutation(before, result.items);
        void queueTitleWrite(`${checkpoint.ownerUid ?? "guest"}:${libraryItemKey(result.item)}`, () =>
          pushLibraryItem(result.item, checkpoint.ownerUid), result.item.savedTitleAliases
        ).catch(() => {
          if (rollbackMutation(checkpoint, set)) toast.error("Gagal menyimpan sumber alternatif");
        });
        return true;
      },

      relinkTitle: (savedTitleIdOrKey, newSourceId, newMangaId, extra) => {
        const previousState = get().items;
        let updatedItem: LibraryItem | null = null;

        set((state) => {
          let existing: LibraryItem | undefined = state.items[savedTitleIdOrKey];

          if (!existing) {
            existing = Object.values(state.items).find(
              (i) =>
                i.id === savedTitleIdOrKey || i.savedTitleAliases?.includes(savedTitleIdOrKey) ||
                (i.primarySourceId === newSourceId && i.primaryMangaId === newMangaId) ||
                getLibraryId(i.sourceId, i.mangaId) === savedTitleIdOrKey
            );
          }

          if (!existing) return state;

          const currentPrimarySourceId = existing.primarySourceId ?? existing.sourceId;
          const currentPrimaryMangaId = existing.primaryMangaId ?? existing.mangaId;

          const existingLinked = (existing.linkedSources ?? []).filter(
            (source) => !(source.sourceId === newSourceId && source.mangaId === newMangaId)
          );
          const alreadyLinked = existingLinked.some(
            (source) => source.sourceId === currentPrimarySourceId && source.mangaId === currentPrimaryMangaId
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
          if (currentPrimarySourceId !== newSourceId || currentPrimaryMangaId !== newMangaId) {
            const oldKey = canonicalSourceKey(currentPrimarySourceId, currentPrimaryMangaId);
            const newKey = canonicalSourceKey(newSourceId, newMangaId);
            const previousProgress = Object.fromEntries(Object.entries(librarySourceProgress(existing))
              .filter(([, value]) => value !== undefined));
            const progressBySource = { ...existing.progressBySource, [oldKey]: previousProgress };
            const newProgress = progressBySource[newKey];
            delete progressBySource[newKey];
            updatedItem = { ...updatedItem, ...librarySourceProgress({}), ...newProgress, progressBySource };
          }

          const conflict = Object.values(state.items).some(item => item !== existing &&
            itemReferencesSource(item, newSourceId, newMangaId) &&
            (Boolean(item.isNsfw) !== Boolean(existing.isNsfw) ||
              (item.canonicalWorkId && existing.canonicalWorkId && item.canonicalWorkId !== existing.canonicalWorkId)));
          if (conflict) {
            updatedItem = null;
            return state;
          }
          const result = reconcileLibraryItem(state.items, updatedItem, "attach");
          updatedItem = result.item;
          return { items: result.items };
        });

        if (updatedItem) {
          const checkpoint = captureMutation(previousState, get().items);
          void queueTitleWrite(`${checkpoint.ownerUid ?? "guest"}:${(updatedItem as LibraryItem).id ?? savedTitleIdOrKey}`, () =>
            pushLibraryItem(updatedItem!, checkpoint.ownerUid), (updatedItem as LibraryItem).savedTitleAliases
          ).catch(() => {
            if (rollbackMutation(checkpoint, set)) {
              toast.error("Gagal Memperbarui Sumber", {
                description: "Tautan sumber bacaan belum berhasil disimpan ke akunmu.",
              });
            }
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
              itemReferencesSource(i, sourceId, mangaId)
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
            ...updateLibrarySourceProgress(existing, sourceId, mangaId, patch),
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
          const checkpoint = captureMutation(previousState, get().items);
          void queueTitleWrite(`${checkpoint.ownerUid ?? "guest"}:${(updatedItem as LibraryItem).id ?? getLibraryId(sourceId, mangaId)}`, () =>
            pushLibraryItem(updatedItem!, checkpoint.ownerUid)
          ).catch(() => {
            rollbackMutation(checkpoint, set);
          });
        }
      },

      clearLibrary: () => {
        libraryResetVersion += 1;
        set({ items: {} });
      },

      syncWithCloud: (cloudItems) => set((state) => {
        let items = state.items;
        for (const item of cloudItems) items = reconcileLibraryItem(items, item, "sync").items;
        const cloudById = new Map(cloudItems.map(item => [libraryItemKey(item), item]));
        const ownerUid = getLocalDataOwnerUid();
        for (const item of Object.values(items)) {
          const id = libraryItemKey(item);
          const remote = cloudById.get(id);
          if (JSON.stringify(item) !== JSON.stringify(remote)) {
            void queueTitleWrite(`${ownerUid ?? "guest"}:${id}`, () => pushLibraryItem(item, ownerUid)).catch(() => undefined);
          }
        }
        return { items };
      }),
    }),
    {
      name: "yomirra-library",
      version: 1,
      merge: (persisted, current) => {
        const saved = persisted as { items?: Record<string, LibraryItem> } | undefined;
        return { ...current, items: reconcileStoredLibrary(saved?.items ?? {}) };
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
