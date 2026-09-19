import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MangaUpdateItem } from "@/shared/types/update";
import { useSettingsStore } from "@/shared/store/settings-store";

/** @deprecated Use savedTitleId directly. Only valid for legacy pre-Phase-1 titles. */
export const getUpdateKey = (sourceId: string, mangaId: string) => `${sourceId}::${mangaId}`;

export interface UpdateState {
  items: Record<string, MangaUpdateItem>;

  upsertUpdate: (update: MangaUpdateItem & { savedTitleId?: string }) => void;
  /** @deprecated Pass savedTitleId directly via markAsSeenById */
  markAsSeen: (sourceId: string, mangaId: string) => void;
  markAsSeenById: (savedTitleId: string) => void;
  markAllAsSeen: () => void;
  /** @deprecated Pass savedTitleId directly via removeUpdateById */
  removeUpdate: (sourceId: string, mangaId: string) => void;
  removeUpdateById: (savedTitleId: string) => void;
  clearUpdates: () => void;
  getUnreadCount: () => number;
  /** @deprecated Use getUpdateById */
  getUpdate: (sourceId: string, mangaId: string) => MangaUpdateItem | undefined;
  getUpdateById: (savedTitleId: string) => MangaUpdateItem | undefined;
}

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => ({
      items: {},

      upsertUpdate: (update) => set((state) => {
        if (!update || !update.sourceId || !update.mangaId) return state;

        // Use savedTitleId if provided (Phase 1 UUID titles), else fall back to composite key
        const key = update.savedTitleId ?? getUpdateKey(update.sourceId, update.mangaId);
        const existing = state.items[key];
        const nowIso = new Date().toISOString();

        let finalDetectedAt = update.detectedAt;
        let finalSeenAt = update.seenAt;

        if (existing) {
          const isSameChapter =
            existing.latestChapterId &&
            update.latestChapterId &&
            existing.latestChapterId === update.latestChapterId;

          if (isSameChapter) {
            // Re-scanning same chapter -> retain previous detectedAt & seenAt (or heal if existing was unset)
            finalDetectedAt = existing.detectedAt;
            finalSeenAt = existing.seenAt ?? update.seenAt;
          } else {
            // New chapter detected -> update detectedAt
            finalDetectedAt = update.detectedAt || nowIso;
            finalSeenAt = update.seenAt;
          }
        } else {
          // Brand new record
          if (!finalDetectedAt && update.latestChapterId) {
            finalDetectedAt = update.seenAt || nowIso;
          }
        }

        const mergedItem: MangaUpdateItem = {
          ...existing,
          ...update,
          detectedAt: finalDetectedAt,
          seenAt: finalSeenAt,
          lastCheckedAt: update.lastCheckedAt || nowIso,
          error: "error" in update ? update.error : undefined,
        };

        return {
          items: {
            ...state.items,
            [key]: mergedItem,
          },
        };
      }),

      markAsSeen: (sourceId, mangaId) => {
        const key = getUpdateKey(sourceId, mangaId);
        useUpdateStore.getState().markAsSeenById(key);
      },

      markAsSeenById: (savedTitleId) => set((state) => {
        const existing = state.items[savedTitleId];
        if (!existing) return state;
        return {
          items: { ...state.items, [savedTitleId]: { ...existing, seenAt: new Date().toISOString() } },
        };
      }),

      markAllAsSeen: () => set((state) => {
        const nowIso = new Date().toISOString();
        const updatedItems: Record<string, MangaUpdateItem> = {};

        Object.entries(state.items).forEach(([key, item]) => {
          updatedItems[key] = {
            ...item,
            seenAt: nowIso,
          };
        });

        return { items: updatedItems };
      }),

      removeUpdate: (sourceId, mangaId) => {
        useUpdateStore.getState().removeUpdateById(getUpdateKey(sourceId, mangaId));
      },

      removeUpdateById: (savedTitleId) => set((state) => {
        if (!state.items[savedTitleId]) return state;
        const newItems = { ...state.items };
        delete newItems[savedTitleId];
        return { items: newItems };
      }),

      clearUpdates: () => set({ items: {} }),

      getUnreadCount: () => {
        const { notifyForAllLibraryItems, mutedMangaKeys } = useSettingsStore.getState();
        if (!notifyForAllLibraryItems) return 0;

        const items = get().items;
        const now = Date.now();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

        return Object.entries(items).filter(([key, item]) => {
          if (!item || !item.sourceId || !item.mangaId || key === "undefined::undefined") return false;
          if (!item.latestChapterId || item.error) return false;
          if (mutedMangaKeys.includes(key)) return false;
          if (!item.detectedAt) return false;

          const detectedTime = Date.parse(item.detectedAt);
          if (isNaN(detectedTime)) return false;

          // Pure 24-hour daily window: only count updates detected in the last 24 hours
          if (now - detectedTime > TWENTY_FOUR_HOURS_MS) return false;

          if (!item.seenAt) return true;
          const seenTime = Date.parse(item.seenAt);
          return !isNaN(seenTime) && (detectedTime - seenTime > 1000);
        }).length;
      },

      getUpdate: (sourceId, mangaId) => {
        const direct = get().items[getUpdateKey(sourceId, mangaId)];
        if (direct) return direct;
        return Object.values(get().items).find(
          (i) => i.sourceId === sourceId && i.mangaId === mangaId
        );
      },

      getUpdateById: (savedTitleId) => {
        return get().items[savedTitleId];
      },
    }),
    {
      name: "yomirra-updates",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || !persistedState.items) {
          return { items: {} };
        }

        if (version < 2) {
          const cleanedItems: Record<string, MangaUpdateItem> = {};
          const nowIso = new Date().toISOString();

          for (const [key, item] of Object.entries(persistedState.items as Record<string, any>)) {
            // Skip corrupted entries (e.g. undefined::undefined or missing IDs)
            if (!item || !item.sourceId || !item.mangaId || key === "undefined::undefined") {
              continue;
            }

            // Heal legacy items: any existing item from legacy scans without seenAt is marked seen
            cleanedItems[key] = {
              ...item,
              seenAt: item.seenAt || item.detectedAt || nowIso,
            };
          }

          return {
            ...persistedState,
            items: cleanedItems,
          };
        }

        return persistedState;
      },
    }
  )
);
