import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LibraryFilterState {
  selectedGenres: string[];
  excludedGenres: string[];
  selectedFormats: string[];
  selectedStatuses: string[];
  selectedCollections: string[];
  selectedReadingStatuses: string[];
  sort: string;
  query: string;
  viewMode: "grid" | "list";

  setFilters: (filters: Partial<LibraryFilterState>) => void;
  resetFilters: () => void;
}

export const useLibraryFilterStore = create<LibraryFilterState>()(
  persist(
    (set) => ({
      selectedGenres: [],
      excludedGenres: [],
      selectedFormats: [],
      selectedStatuses: [],
      selectedCollections: [],
      selectedReadingStatuses: [],
      sort: "popular",
      query: "",
      viewMode: "grid",

      setFilters: (filters) => set((state) => ({ ...state, ...filters })),
      resetFilters: () => set({
        selectedGenres: [],
        excludedGenres: [],
        selectedFormats: [],
        selectedStatuses: [],
        selectedCollections: [],
        selectedReadingStatuses: [],
        sort: "popular",
        query: "",
      })
    }),
    {
      name: "yomirra-library-filters",
    }
  )
);
