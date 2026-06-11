import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushLibraryItem, deleteLibraryItem } from "@/shared/lib/sync-utils";

export type LibraryItem = {
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
};

interface LibraryState {
  items: Record<string, LibraryItem>;
  
  addToLibrary: (item: LibraryItem) => void;
  removeFromLibrary: (sourceId: string, mangaId: string) => void;
  toggleLibrary: (item: LibraryItem) => void;
  isInLibrary: (sourceId: string, mangaId: string) => boolean;
  getLibraryItem: (sourceId: string, mangaId: string) => LibraryItem | undefined;
  updateLibraryItem: (sourceId: string, mangaId: string, patch: Partial<LibraryItem>) => void;
  clearLibrary: () => void;
  syncWithCloud: (cloudItems: LibraryItem[]) => void;
}

const getLibraryId = (sourceId: string, mangaId: string) => `${sourceId}::${mangaId}`;

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      items: {},

      addToLibrary: (item) => set((state) => {
        const id = getLibraryId(item.sourceId, item.mangaId);
        pushLibraryItem(item); // Background sync
        return {
          items: {
            ...state.items,
            [id]: item,
          }
        };
      }),

      removeFromLibrary: (sourceId, mangaId) => set((state) => {
        const id = getLibraryId(sourceId, mangaId);
        const newItems = { ...state.items };
        delete newItems[id];
        deleteLibraryItem(sourceId, mangaId); // Background sync
        return { items: newItems };
      }),

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
        return !!get().items[id];
      },

      getLibraryItem: (sourceId, mangaId) => {
        const id = getLibraryId(sourceId, mangaId);
        return get().items[id];
      },

      updateLibraryItem: (sourceId, mangaId, patch) => set((state) => {
        const id = getLibraryId(sourceId, mangaId);
        const existing = state.items[id];
        if (!existing) return state;

        const updatedItem = { ...existing, ...patch, updatedAt: new Date().toISOString() };
        pushLibraryItem(updatedItem); // Background sync

        return {
          items: {
            ...state.items,
            [id]: updatedItem,
          }
        };
      }),

      clearLibrary: () => set({ items: {} }),

      syncWithCloud: (cloudItems) => set((state) => {
        const newItems = { ...state.items };
        let hasChanges = false;
        
        for (const cloudItem of cloudItems) {
          const id = getLibraryId(cloudItem.sourceId, cloudItem.mangaId);
          const localItem = newItems[id];
          
          if (!localItem) {
            newItems[id] = cloudItem;
            hasChanges = true;
          } else {
            const localTime = new Date(localItem.updatedAt).getTime();
            const cloudTime = new Date(cloudItem.updatedAt).getTime();
            
            if (cloudTime > localTime) {
              newItems[id] = cloudItem;
              hasChanges = true;
            } else if (localTime > cloudTime) {
              // Local is newer, push to cloud to sync up
              pushLibraryItem(localItem);
            }
          }
        }

        // Push any local items that don't exist in the cloud
        const cloudIds = new Set(cloudItems.map(item => getLibraryId(item.sourceId, item.mangaId)));
        for (const [id, localItem] of Object.entries(state.items)) {
          if (!cloudIds.has(id)) {
            pushLibraryItem(localItem);
          }
        }

        return hasChanges ? { items: newItems } : state;
      }),
    }),
    {
      name: "yomirra-library",
    }
  )
);
