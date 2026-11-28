import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

// Read the document navigation only during initial store hydration.
// Route remounts within the document retain filters for back navigation.
function readLibraryFilterStorage() {
  if (typeof window === "undefined") throw new Error("Session storage is unavailable");
  const storage = window.sessionStorage;
  const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === "reload") storage.removeItem("yomirra-library-filters");
  return storage;
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
      storage: createJSONStorage(readLibraryFilterStorage),
    }
  )
);
