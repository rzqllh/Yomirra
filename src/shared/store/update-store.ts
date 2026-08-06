import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MangaUpdateItem } from "@/shared/types/update";
import { useSettingsStore } from "@/shared/store/settings-store";

export const getUpdateKey = (sourceId: string, mangaId: string) => `${sourceId}::${mangaId}`;

export interface UpdateState {
  items: Record<string, MangaUpdateItem>;

  upsertUpdate: (update: MangaUpdateItem) => void;
  markAsSeen: (sourceId: string, mangaId: string) => void;
  markAllAsSeen: () => void;
  removeUpdate: (sourceId: string, mangaId: string) => void;
  clearUpdates: () => void;
  getUnreadCount: () => number;
  getUpdate: (sourceId: string, mangaId: string) => MangaUpdateItem | undefined;
}

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => ({
      items: {},

      upsertUpdate: (update) => set((state) => {
        const key = getUpdateKey(update.sourceId, update.mangaId);
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
            // Re-scanning same chapter -> retain previous detectedAt & seenAt
            finalDetectedAt = existing.detectedAt;
            finalSeenAt = existing.seenAt;
          } else {
            // New chapter detected -> update detectedAt
            finalDetectedAt = update.detectedAt || nowIso;
            finalSeenAt = undefined;
          }
        } else {
          // Brand new record
          if (!finalDetectedAt && update.latestChapterId) {
            finalDetectedAt = nowIso;
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

      markAsSeen: (sourceId, mangaId) => set((state) => {
        const key = getUpdateKey(sourceId, mangaId);
        const existing = state.items[key];
        if (!existing) return state;

        return {
          items: {
            ...state.items,
            [key]: {
              ...existing,
              seenAt: new Date().toISOString(),
            },
          },
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

      removeUpdate: (sourceId, mangaId) => set((state) => {
        const key = getUpdateKey(sourceId, mangaId);
        if (!state.items[key]) return state;

        const newItems = { ...state.items };
        delete newItems[key];

        return { items: newItems };
      }),

      clearUpdates: () => set({ items: {} }),

      getUnreadCount: () => {
        const { notifyForAllLibraryItems, mutedMangaKeys } = useSettingsStore.getState();
        if (!notifyForAllLibraryItems) return 0;

        const items = get().items;
        return Object.entries(items).filter(([key, item]) => {
          if (mutedMangaKeys.includes(key)) return false;
          if (!item.detectedAt) return false;
          if (!item.seenAt) return true;
          const detectedTime = Date.parse(item.detectedAt);
          const seenTime = Date.parse(item.seenAt);
          return !isNaN(detectedTime) && !isNaN(seenTime) && detectedTime > seenTime;
        }).length;
      },

      getUpdate: (sourceId, mangaId) => {
        const key = getUpdateKey(sourceId, mangaId);
        return get().items[key];
      },
    }),
    {
      name: "yomirra-updates",
      version: 1,
      migrate: (persistedState: any) => {
        return persistedState || { items: {} };
      },
    }
  )
);
