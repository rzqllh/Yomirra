import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Collection, CollectionState, MangaKey, ReadingStatus } from "../types/collection";

interface CollectionActions {
  createCollection: (name: string) => void;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  reorderCollections: (ids: string[]) => void;
  
  addMangaToCollection: (mangaKey: MangaKey, collectionId: string) => void;
  removeMangaFromCollection: (mangaKey: MangaKey, collectionId: string) => void;
  
  setReadingStatus: (mangaKey: MangaKey, status: ReadingStatus) => void;
  clearReadingStatus: (mangaKey: MangaKey) => void;
}

export type CollectionStore = CollectionState & CollectionActions;

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collections: [],
      membershipsByManga: {},
      readingStatusByManga: {},

      createCollection: (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) throw new Error("Collection name cannot be empty");
        
        const state = get();
        const exists = state.collections.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (exists) throw new Error("Collection name already exists");

        const newCollection: Collection = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          name: trimmedName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sortOrder: state.collections.length,
        };

        set({ collections: [...state.collections, newCollection] });
      },

      renameCollection: (id: string, name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) throw new Error("Collection name cannot be empty");

        const state = get();
        const exists = state.collections.some(c => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase());
        if (exists) throw new Error("Collection name already exists");

        set({
          collections: state.collections.map(c => 
            c.id === id 
              ? { ...c, name: trimmedName, updatedAt: new Date().toISOString() } 
              : c
          )
        });
      },

      deleteCollection: (id: string) => {
        set((state) => {
          // Remove collection
          const newCollections = state.collections.filter(c => c.id !== id);
          
          // Remove from all memberships
          const newMemberships: Record<MangaKey, string[]> = {};
          for (const [mangaKey, collectionIds] of Object.entries(state.membershipsByManga)) {
            const filteredIds = collectionIds.filter(cId => cId !== id);
            if (filteredIds.length > 0) {
              newMemberships[mangaKey as MangaKey] = filteredIds;
            }
          }

          // Fix sort orders
          const sortedCollections = newCollections
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((c, index) => ({ ...c, sortOrder: index }));

          return {
            collections: sortedCollections,
            membershipsByManga: newMemberships,
          };
        });
      },

      reorderCollections: (ids: string[]) => {
        set((state) => {
          const newCollections = [...state.collections];
          
          // Validate we have all IDs and they match length
          if (ids.length !== newCollections.length) return state;

          for (let i = 0; i < ids.length; i++) {
            const collectionIndex = newCollections.findIndex(c => c.id === ids[i]);
            if (collectionIndex !== -1) {
              newCollections[collectionIndex] = {
                ...newCollections[collectionIndex],
                sortOrder: i
              };
            }
          }

          return { collections: newCollections.sort((a, b) => a.sortOrder - b.sortOrder) };
        });
      },

      addMangaToCollection: (mangaKey: MangaKey, collectionId: string) => {
        set((state) => {
          const currentMemberships = state.membershipsByManga[mangaKey] || [];
          if (currentMemberships.includes(collectionId)) return state;

          return {
            membershipsByManga: {
              ...state.membershipsByManga,
              [mangaKey]: [...currentMemberships, collectionId],
            }
          };
        });
      },

      removeMangaFromCollection: (mangaKey: MangaKey, collectionId: string) => {
        set((state) => {
          const currentMemberships = state.membershipsByManga[mangaKey] || [];
          if (!currentMemberships.includes(collectionId)) return state;

          const newMemberships = currentMemberships.filter(id => id !== collectionId);
          
          const nextMembershipsMap = { ...state.membershipsByManga };
          if (newMemberships.length > 0) {
            nextMembershipsMap[mangaKey] = newMemberships;
          } else {
            delete nextMembershipsMap[mangaKey];
          }

          return { membershipsByManga: nextMembershipsMap };
        });
      },

      setReadingStatus: (mangaKey: MangaKey, status: ReadingStatus) => {
        set((state) => ({
          readingStatusByManga: {
            ...state.readingStatusByManga,
            [mangaKey]: status,
          }
        }));
      },

      clearReadingStatus: (mangaKey: MangaKey) => {
        set((state) => {
          if (!state.readingStatusByManga[mangaKey]) return state;
          
          const nextStatuses = { ...state.readingStatusByManga };
          delete nextStatuses[mangaKey];
          return { readingStatusByManga: nextStatuses };
        });
      }
    }),
    {
      name: "yomirra-collections",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as Partial<CollectionState>;
        
        if (version === 0) {
          // Future-proof for initial structure
        }
        
        return {
          collections: state?.collections || [],
          membershipsByManga: state?.membershipsByManga || {},
          readingStatusByManga: state?.readingStatusByManga || {},
        } as CollectionState;
      }
    }
  )
);
