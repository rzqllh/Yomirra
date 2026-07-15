import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchFilterState {
  selectedSources: string[] | null; // null means not initialized (should use all available)
  setSelectedSources: (sources: string[]) => void;
  toggleSource: (sourceId: string) => void;
  
  genres: string[];
  formats: string[];
  status: string;
  sort: string;
  
  applyFilters: (filters: { genres: string[], formats?: string[], status: string, sort: string }) => void;
  resetFilters: () => void;
}

export const useSearchFilterStore = create<SearchFilterState>()(
  persist(
    (set) => ({
      selectedSources: null,
      setSelectedSources: (sources) => set({ selectedSources: sources }),
      toggleSource: (id) => set((state) => {
        if (!state.selectedSources) return state;
        return {
          selectedSources: state.selectedSources.includes(id)
            ? state.selectedSources.filter(s => s !== id)
            : [...state.selectedSources, id]
        };
      }),

      genres: [],
      formats: [],
      status: "",
      sort: "popular",

      applyFilters: (filters) => set({
        genres: filters.genres,
        formats: filters.formats || [],
        status: filters.status,
        sort: filters.sort
      }),
      resetFilters: () => set({ genres: [], formats: [], status: "", sort: "popular" })
    }),
    {
      name: "yomirra-search-filters",
    }
  )
);
