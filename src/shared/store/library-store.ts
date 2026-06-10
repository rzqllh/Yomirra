import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LibraryItem = {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl?: string;
  author?: string;
  status?: string;
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
}

const getLibraryId = (sourceId: string, mangaId: string) => `${sourceId}::${mangaId}`;

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      items: {},

      addToLibrary: (item) => set((state) => {
        const id = getLibraryId(item.sourceId, item.mangaId);
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

        return {
          items: {
            ...state.items,
            [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
          }
        };
      }),

      clearLibrary: () => set({ items: {} }),
    }),
    {
      name: "yomirra-library",
    }
  )
);
