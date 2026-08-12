"use client";

import * as React from "react";
import { FilterDrawerShell, FilterSection } from "@/components/ui/filter-drawer-shell";
import { FilterChip } from "@/components/ui/filter-chip";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";

interface LibraryFilterDrawerProps {
  children?: React.ReactNode;
  activeSourceId: string;
}

const DEFAULT_STATUSES = [
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "hiatus", label: "Hiatus" },
  { id: "cancelled", label: "Cancelled" }
];

const LOCAL_READING_STATUSES = [
  { id: "reading", label: "Sedang Dibaca" },
  { id: "completed", label: "Selesai" },
  { id: "on-hold", label: "Ditunda" },
  { id: "dropped", label: "Dihentikan" },
  { id: "plan-to-read", label: "Akan Dibaca" },
];

const DEFAULT_SORTS = [
  { id: "popular", label: "Paling Populer" },
  { id: "latest", label: "Update Terbaru" },
  { id: "alphabetical", label: "A-Z" }
];

export function LibraryFilterDrawer({ children, activeSourceId }: LibraryFilterDrawerProps) {
  const storeFilters = useLibraryFilterStore();

  // Local state for filters before applying
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [selectedSort, setSelectedSort] = React.useState<string>("popular");
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = React.useState<string[]>([]);
  const [selectedReadingStatuses, setSelectedReadingStatuses] = React.useState<string[]>([]);

  const { collections } = useCollectionStore();

  const { data: filtersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
    staleTime: Infinity,
  });

  const dynamicFilters = React.useMemo(() => {
    const genres = filtersData?.genres?.map((g: any) => ({ id: g.id, label: g.name })) || [];
    const finalStatuses = filtersData?.statuses && filtersData.statuses.length > 0 
      ? filtersData.statuses.map((s: any) => ({ id: s.id, label: s.name }))
      : DEFAULT_STATUSES;
    const finalSorts = filtersData?.sorts && filtersData.sorts.length > 0
      ? filtersData.sorts.map((s: any) => ({ id: s.id, label: s.name }))
      : DEFAULT_SORTS;
    const finalFormats = filtersData?.formats?.map((f: any) => ({ id: f.id, label: f.name })) || [];

    return { genres, statuses: finalStatuses, sorts: finalSorts, formats: finalFormats };
  }, [filtersData]);

  const syncFromStore = () => {
    setSelectedGenres(storeFilters.selectedGenres || []);
    setExcludedGenres(storeFilters.excludedGenres || []);
    setSelectedFormats(storeFilters.selectedFormats || []);
    setSelectedStatus(storeFilters.selectedStatuses || []);
    setSelectedCollections(storeFilters.selectedCollections || []);
    setSelectedReadingStatuses(storeFilters.selectedReadingStatuses || []);
    setSelectedSort(storeFilters.sort || "popular");
  };

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(prev => prev.filter(g => g !== genreId));
      setExcludedGenres(prev => [...prev, genreId]);
    } else if (excludedGenres.includes(genreId)) {
      setExcludedGenres(prev => prev.filter(g => g !== genreId));
    } else {
      setSelectedGenres(prev => [...prev, genreId]);
    }
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatus(prev => 
      prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]
    );
  };

  const toggleCollection = (colId: string) => {
    setSelectedCollections(prev => 
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  const toggleReadingStatus = (statusId: string) => {
    setSelectedReadingStatuses(prev => 
      prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]
    );
  };

  const handleApply = () => {
    storeFilters.setFilters({
      selectedGenres,
      excludedGenres,
      selectedFormats,
      selectedStatuses: selectedStatus,
      selectedCollections,
      selectedReadingStatuses,
      sort: selectedSort
    });
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setExcludedGenres([]);
    setSelectedFormats([]);
    setSelectedStatus([]);
    setSelectedCollections([]);
    setSelectedReadingStatuses([]);
    setSelectedSort("popular");
  };

  const activeCount = selectedGenres.length + excludedGenres.length + selectedFormats.length + selectedStatus.length + selectedCollections.length + selectedReadingStatuses.length + (selectedSort !== "popular" ? 1 : 0);

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
      <FilterSection title="Urutkan">
        {dynamicFilters.sorts.map((sort: any) => (
          <FilterChip
            key={sort.id}
            onClick={() => setSelectedSort(sort.id)}
            selected={selectedSort === sort.id}
            variant={selectedSort === sort.id ? "inverted" : "default"}
            label={sort.label}
          />
        ))}
      </FilterSection>

      {/* Tipe / Format */}
      {dynamicFilters.formats.length > 0 && (
        <FilterSection title="Tipe Komik">
          {dynamicFilters.formats.map((format: any) => (
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

      {/* Status */}
      <FilterSection title="Status" layout="grid">
        {dynamicFilters.statuses.map((status: any) => (
          <FilterChip
            key={status.id}
            onClick={() => toggleStatus(status.id)}
            selected={selectedStatus.includes(status.id)}
            variant={selectedStatus.includes(status.id) ? "accent-subtle" : "default"}
            showCheck={selectedStatus.includes(status.id)}
            label={status.label}
          />
        ))}
      </FilterSection>

      {/* Genre */}
      {dynamicFilters.genres.length > 0 && (
        <FilterSection title="Genre" layout="grid">
          {dynamicFilters.genres.map((genre: any) => {
            const isInc = selectedGenres.includes(genre.id);
            const isExc = excludedGenres.includes(genre.id);
            return (
              <FilterChip
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                selected={isInc || isExc}
                variant={isInc ? "accent-solid" : isExc ? "error-solid" : "default"}
                showMinus={isExc}
                label={genre.label}
              />
            );
          })}
        </FilterSection>
      )}

      {/* Koleksi (Lokal) */}
      {collections.length > 0 && (
        <FilterSection title="Koleksi (Lokal)" layout="grid">
          {collections.map((col: any) => (
            <FilterChip
              key={col.id}
              onClick={() => toggleCollection(col.id)}
              selected={selectedCollections.includes(col.id)}
              variant={selectedCollections.includes(col.id) ? "accent-subtle" : "default"}
              showCheck={selectedCollections.includes(col.id)}
              label={col.name}
            />
          ))}
        </FilterSection>
      )}

      {/* Status Membaca (Lokal) */}
      <FilterSection title="Status Membaca (Lokal)" layout="grid">
        {LOCAL_READING_STATUSES.map((status: any) => (
          <FilterChip
            key={status.id}
            onClick={() => toggleReadingStatus(status.id)}
            selected={selectedReadingStatuses.includes(status.id)}
            variant={selectedReadingStatuses.includes(status.id) ? "accent-subtle" : "default"}
            showCheck={selectedReadingStatuses.includes(status.id)}
            label={status.label}
          />
        ))}
      </FilterSection>
    </FilterDrawerShell>
  );
}
