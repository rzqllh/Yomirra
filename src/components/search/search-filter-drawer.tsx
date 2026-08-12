"use client";

import * as React from "react";
import { FilterDrawerShell, FilterSection } from "@/components/ui/filter-drawer-shell";
import { FilterChip } from "@/components/ui/filter-chip";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useQuery, useQueries } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { mergeFilters } from "@/shared/utils/filter-helpers";
import type { FilterList } from "@/shared/sources/source-types";

interface SearchFilterDrawerProps {
  children?: React.ReactNode;
}

export function SearchFilterDrawer({ children }: SearchFilterDrawerProps) {
  const storeFilters = useSearchFilterStore();

  // Local state for filters before applying
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [selectedSort, setSelectedSort] = React.useState<string>("popular");
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>([]);
  const [localSources, setLocalSources] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadLocal = () => setLocalSources(dynamicSourceRegistry.getAll());
    loadLocal();
    
    const handleUpdate = () => loadLocal();
    window.addEventListener("sources_updated", handleUpdate);
    return () => window.removeEventListener("sources_updated", handleUpdate);
  }, []);

  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const hideNsfw = useSettingsStore(state => state.hideNsfw);

  const searchableSources = React.useMemo(() => {
    const s = [...(sourcesData || [])];
    localSources.forEach(ls => {
      if (!s.find(x => x.id === ls.id)) {
        s.push(ls);
      }
    });
    
    return s.filter(s => {
      if (!s.isInstalled || !s.capabilities.search) return false;
      if (s.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [sourcesData, localSources, hideNsfw]);

  const activeSelectedSources = storeFilters.selectedSources || [];
  const sourcesToFetch = activeSelectedSources.length > 0
    ? searchableSources.filter(s => activeSelectedSources.includes(s.id))
    : searchableSources;

  const filtersQueries = useQueries({
    queries: sourcesToFetch.map(s => ({
      queryKey: ["filters", s.id],
      queryFn: () => apiClient.getFilters(s.id),
      staleTime: Infinity,
    }))
  });

  const dynamicFilters = React.useMemo(() => {
    const sourceFilters = sourcesToFetch.map((s, idx) => ({
      sourceId: s.id,
      filters: filtersQueries[idx]?.data
    })).filter(x => x.filters) as { sourceId: string; filters: FilterList }[];

    return mergeFilters(sourceFilters);
  }, [filtersQueries, sourcesToFetch]);

  const syncFromStore = () => {
    setSelectedGenres(storeFilters.genres);
    setSelectedFormats(storeFilters.formats || []);
    setSelectedStatus(storeFilters.status);
    setSelectedSort(storeFilters.sort || "popular");
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleApply = () => {
    storeFilters.applyFilters({
      genres: selectedGenres,
      formats: selectedFormats,
      status: selectedStatus,
      sort: selectedSort
    });
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedStatus("");
    setSelectedSort("popular");
  };

  const activeCount = storeFilters.genres.length + (storeFilters.formats?.length || 0) + (storeFilters.status ? 1 : 0) + (storeFilters.sort !== "popular" && storeFilters.sort ? 1 : 0);

  return (
    <FilterDrawerShell
      title="Filter Pencarian"
      description="Atur filter pencarian berdasarkan urutan, status, dan genre manga."
      activeCount={activeCount}
      onApply={handleApply}
      onReset={handleReset}
      onOpen={syncFromStore}
      trigger={children}
    >
      {/* Urutkan */}
      {dynamicFilters.sorts.length > 0 && (
        <FilterSection title="Urutkan">
          {dynamicFilters.sorts.map(sort => (
            <FilterChip
              key={sort.id}
              onClick={() => setSelectedSort(sort.id)}
              selected={selectedSort === sort.id}
              variant={selectedSort === sort.id ? "inverted" : "default"}
              label={sort.label}
            />
          ))}
        </FilterSection>
      )}

      {/* Tipe / Format */}
      {dynamicFilters.formats.length > 0 && (
        <FilterSection title="Tipe Komik">
          {dynamicFilters.formats.map(format => (
            <FilterChip
              key={format.id}
              onClick={() => toggleFormat(format.id)}
              selected={selectedFormats.includes(format.id)}
              variant={selectedFormats.includes(format.id) ? "accent-subtle" : "default"}
              showCheck={selectedFormats.includes(format.id)}
              label={format.label}
            />
          ))}
        </FilterSection>
      )}

      {/* Status Rilis */}
      {dynamicFilters.statuses.length > 0 && (
        <FilterSection title="Status Rilis">
          {dynamicFilters.statuses.map(status => (
            <FilterChip
              key={status.id}
              onClick={() => setSelectedStatus(status.id === selectedStatus ? "" : status.id)}
              selected={selectedStatus === status.id}
              variant={selectedStatus === status.id ? "accent-subtle" : "default"}
              showCheck={selectedStatus === status.id}
              label={status.label}
            />
          ))}
        </FilterSection>
      )}

      {/* Genre */}
      {dynamicFilters.genres.length > 0 && (
        <FilterSection title="Genre">
          {dynamicFilters.genres.map(genre => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <FilterChip
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                selected={isSelected}
                variant={isSelected ? "accent-solid" : "default"}
                label={genre.label}
              />
            );
          })}
        </FilterSection>
      )}
    </FilterDrawerShell>
  );
}
