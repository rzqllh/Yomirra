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
  pruneFilters: (availableGenres: string[], availableFormats: string[], availableStatuses: string[], availableSorts: string[]) => void;
  resetFilters: () => void;
}

export const useSearchFilterStore = create<SearchFilterState>()(
  persist(
    (set) => ({
      selectedSources: null,
      setSelectedSources: (sources) => set({ selectedSources: sources }),
      toggleSource: (sourceId) => set((state) => {
        const current = state.selectedSources || [];
        const isSelected = current.includes(sourceId);
        if (isSelected) {
          return { selectedSources: current.filter(id => id !== sourceId) };
        } else {
          return { selectedSources: [...current, sourceId] };
        }
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
      pruneFilters: (availableGenres, availableFormats, availableStatuses, availableSorts) => set((state) => {
        const newGenres = state.genres.filter(g => availableGenres.includes(g));
        const newFormats = (state.formats || []).filter(f => availableFormats.includes(f));
        const newStatus = availableStatuses.includes(state.status) ? state.status : "";
        const newSort = availableSorts.includes(state.sort) ? state.sort : "popular";

        // Only update state if something actually changed
        if (
          newGenres.length !== state.genres.length ||
          newFormats.length !== (state.formats?.length || 0) ||
          newStatus !== state.status ||
          newSort !== state.sort
        ) {
          return { genres: newGenres, formats: newFormats, status: newStatus, sort: newSort };
        }
        return state;
      }),
      resetFilters: () => set({ genres: [], formats: [], status: "", sort: "popular" })
    }),
    {
      name: "yomirra-search-filters",
    }
  )
);
