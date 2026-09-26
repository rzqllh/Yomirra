import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SearchFilterState {
  hasCustomizedSources: boolean;
  selectedSources: string[] | null; // null means dynamic all-candidate behavior
  setSelectedSources: (sources: string[]) => void;
  toggleSource: (sourceId: string, candidateSourceIds?: string[]) => void;

  genres: string[];
  formats: string[];
  status: string;
  sort: string;

  applyFilters: (filters: { genres: string[]; formats?: string[]; status: string; sort: string }) => void;
  pruneFilters: (
    availableGenres: string[],
    availableFormats: string[],
    availableStatuses: string[],
    availableSorts: string[]
  ) => void;
  resetFilters: () => void;
}

export const useSearchFilterStore = create<SearchFilterState>()(
  persist(
    (set) => ({
      hasCustomizedSources: false,
      selectedSources: null,
      setSelectedSources: (sources) => set({ selectedSources: sources, hasCustomizedSources: true }),
      toggleSource: (sourceId, candidateSourceIds) =>
        set((state) => {
          const current =
            state.selectedSources !== null
              ? state.selectedSources
              : candidateSourceIds || [sourceId];
          const isSelected = current.includes(sourceId);
          if (isSelected) {
            if (current.length <= 1) return state; // Keep at least 1 source selected
            return {
              selectedSources: current.filter((id) => id !== sourceId),
              hasCustomizedSources: true,
            };
          } else {
            return {
              selectedSources: [...current, sourceId],
              hasCustomizedSources: true,
            };
          }
        }),

      genres: [],
      formats: [],
      status: "",
      sort: "popular",

      applyFilters: (filters) =>
        set({
          genres: filters.genres,
          formats: filters.formats || [],
          status: filters.status,
          sort: filters.sort,
        }),
      pruneFilters: (availableGenres, availableFormats, availableStatuses, availableSorts) =>
        set((state) => {
          const newGenres = state.genres.filter((g) => availableGenres.includes(g));
          const newFormats = (state.formats || []).filter((f) => availableFormats.includes(f));
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
      resetFilters: () => set({ genres: [], formats: [], status: "", sort: "popular" }),
    }),
    {
      name: "yomirra-search-filters",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const state = persistedState as any;
          if (Array.isArray(state?.selectedSources)) {
            return {
              ...state,
              selectedSources: state.selectedSources,
              hasCustomizedSources: true,
            };
          }
          return {
            ...state,
            selectedSources: null,
            hasCustomizedSources: false,
          };
        }
        return persistedState as SearchFilterState;
      },
    }
  )
);
