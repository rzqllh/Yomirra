"use client";

import * as React from "react";
import { Funnel } from "@phosphor-icons/react";
import { FilterDrawerShell, FilterSection } from "@/components/ui/filter-drawer-shell";
import { FilterChip } from "@/components/ui/filter-chip";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useQuery, useQueries } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { mergeFilters } from "@/shared/utils/filter-helpers";
import type { FilterList } from "@/shared/sources/source-types";

const NSFW_GENRE_IDENTIFIERS = new Set([
  "adult",
  "ecchi",
  "mature",
  "smut",
  "yaoi",
  "yuri",
  "hentai",
  "erotica",
  "gore",
]);

export function isNsfwGenre(genre: { id: string; label?: string; name?: string }): boolean {
  const id = (genre.id || "").toLowerCase().replace(/[^a-z]/g, "");
  const name = (genre.label || genre.name || "").toLowerCase().replace(/[^a-z]/g, "");
  return NSFW_GENRE_IDENTIFIERS.has(id) || NSFW_GENRE_IDENTIFIERS.has(name);
}

const DEFAULT_STATUSES = [
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "hiatus", label: "Hiatus" },
  { id: "cancelled", label: "Cancelled" },
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
  { id: "rating", label: "Rating Tertinggi" },
  { id: "alphabetical", label: "A-Z" },
];

export interface UnifiedFilterDrawerProps {
  context: "search" | "library";
  activeSourceId?: string;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function UnifiedFilterDrawer({
  context,
  activeSourceId = "",
  trigger,
  children,
}: UnifiedFilterDrawerProps) {
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const effectiveTrigger = trigger || children;

  // Search stores
  const searchStore = useSearchFilterStore();
  // Library stores
  const libraryStore = useLibraryFilterStore();
  const { collections } = useCollectionStore();

  // Local state for buffered filter edits
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [selectedSort, setSelectedSort] = React.useState<string>("popular");
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = React.useState<string[]>([]);
  const [selectedReadingStatuses, setSelectedReadingStatuses] = React.useState<string[]>([]);
  const [localSources, setLocalSources] = React.useState<any[]>([]);

  // ----------------------------------------------------
  // Dynamic Sources & Filters for Search context
  // ----------------------------------------------------
  React.useEffect(() => {
    if (context !== "search") return;
    const loadLocal = () => setLocalSources(dynamicSourceRegistry.getAll());
    loadLocal();
    const handleUpdate = () => loadLocal();
    window.addEventListener("sources_updated", handleUpdate);
    return () => window.removeEventListener("sources_updated", handleUpdate);
  }, [context]);

  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
    enabled: context === "search",
  });

  const searchableSources = React.useMemo(() => {
    if (context !== "search") return [];
    const s = [...(sourcesData || [])];
    localSources.forEach((ls) => {
      if (!s.find((x) => x.id === ls.id)) {
        s.push(ls);
      }
    });

    return s.filter((item) => {
      if (!item.isInstalled || !item.capabilities?.search) return false;
      if (item.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [context, sourcesData, localSources, hideNsfw]);

  const activeSelectedSources = searchStore.selectedSources || [];
  const sourcesToFetch =
    activeSelectedSources.length > 0
      ? searchableSources.filter((s) => activeSelectedSources.includes(s.id))
      : searchableSources;

  const searchFiltersQueries = useQueries({
    queries: (context === "search" ? sourcesToFetch : []).map((s) => ({
      queryKey: ["filters", s.id],
      queryFn: () => apiClient.getFilters(s.id),
      staleTime: Infinity,
    })),
  });

  // ----------------------------------------------------
  // Single Source Filters for Library context
  // ----------------------------------------------------
  const { data: libraryFiltersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
    staleTime: Infinity,
    enabled: context === "library" && Boolean(activeSourceId),
  });

  // ----------------------------------------------------
  // Unified Dynamic Filters with NSFW filtering applied
  // ----------------------------------------------------
  const dynamicFilters = React.useMemo(() => {
    if (context === "search") {
      const sourceFilters = sourcesToFetch
        .map((s, idx) => ({
          sourceId: s.id,
          filters: searchFiltersQueries[idx]?.data,
        }))
        .filter((x) => x.filters) as { sourceId: string; filters: FilterList }[];

      const merged = mergeFilters(sourceFilters);
      const safeGenres = hideNsfw
        ? merged.genres.filter((g) => !isNsfwGenre(g))
        : merged.genres;

      return {
        sorts: merged.sorts,
        formats: merged.formats,
        statuses: merged.statuses,
        genres: safeGenres,
      };
    } else {
      const rawGenres =
        libraryFiltersData?.genres?.map((g: any) => ({
          id: g.id,
          label: g.name,
        })) || [];
      const safeGenres = hideNsfw
        ? rawGenres.filter((g) => !isNsfwGenre(g))
        : rawGenres;

      const finalStatuses =
        libraryFiltersData?.statuses && libraryFiltersData.statuses.length > 0
          ? libraryFiltersData.statuses.map((s: any) => ({ id: s.id, label: s.name }))
          : DEFAULT_STATUSES;
      const finalSorts =
        libraryFiltersData?.sorts && libraryFiltersData.sorts.length > 0
          ? libraryFiltersData.sorts.map((s: any) => ({ id: s.id, label: s.name }))
          : DEFAULT_SORTS;
      const finalFormats =
        libraryFiltersData?.formats?.map((f: any) => ({ id: f.id, label: f.name })) || [];

      return {
        genres: safeGenres,
        statuses: finalStatuses,
        sorts: finalSorts,
        formats: finalFormats,
      };
    }
  }, [context, sourcesToFetch, searchFiltersQueries, libraryFiltersData, hideNsfw]);

  // Sync state when drawer opens
  const syncFromStore = () => {
    if (context === "search") {
      setSelectedGenres(searchStore.genres);
      setSelectedFormats(searchStore.formats || []);
      setSelectedStatus(searchStore.status ? [searchStore.status] : []);
      setSelectedSort(searchStore.sort || "popular");
    } else {
      setSelectedGenres(libraryStore.selectedGenres || []);
      setExcludedGenres(libraryStore.excludedGenres || []);
      setSelectedFormats(libraryStore.selectedFormats || []);
      setSelectedStatus(libraryStore.selectedStatuses || []);
      setSelectedCollections(libraryStore.selectedCollections || []);
      setSelectedReadingStatuses(libraryStore.selectedReadingStatuses || []);
      setSelectedSort(libraryStore.sort || "popular");
    }
  };

  const toggleGenre = (genreId: string) => {
    if (context === "search") {
      setSelectedGenres((prev) =>
        prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
      );
    } else {
      // Library supports tri-state (include -> exclude -> off)
      if (selectedGenres.includes(genreId)) {
        setSelectedGenres((prev) => prev.filter((g) => g !== genreId));
        setExcludedGenres((prev) => [...prev, genreId]);
      } else if (excludedGenres.includes(genreId)) {
        setExcludedGenres((prev) => prev.filter((g) => g !== genreId));
      } else {
        setSelectedGenres((prev) => [...prev, genreId]);
      }
    }
  };

  const toggleFormat = (formatId: string) => {
    setSelectedFormats((prev) =>
      prev.includes(formatId) ? prev.filter((f) => f !== formatId) : [...prev, formatId]
    );
  };

  const toggleStatus = (statusId: string) => {
    if (context === "search") {
      setSelectedStatus((prev) => (prev.includes(statusId) ? [] : [statusId]));
    } else {
      setSelectedStatus((prev) =>
        prev.includes(statusId) ? prev.filter((s) => s !== statusId) : [...prev, statusId]
      );
    }
  };

  const toggleCollection = (colId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const toggleReadingStatus = (statusId: string) => {
    setSelectedReadingStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((s) => s !== statusId) : [...prev, statusId]
    );
  };

  const handleApply = () => {
    if (context === "search") {
      searchStore.applyFilters({
        genres: selectedGenres,
        formats: selectedFormats,
        status: selectedStatus[0] || "",
        sort: selectedSort,
      });
    } else {
      libraryStore.setFilters({
        selectedGenres,
        excludedGenres,
        selectedFormats,
        selectedStatuses: selectedStatus,
        selectedCollections,
        selectedReadingStatuses,
        sort: selectedSort,
      });
    }
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

  const activeCount =
    context === "search"
      ? searchStore.genres.length +
        (searchStore.formats?.length || 0) +
        (searchStore.status ? 1 : 0) +
        (searchStore.sort !== "popular" && searchStore.sort ? 1 : 0)
      : (libraryStore.selectedGenres?.length || 0) +
        (libraryStore.excludedGenres?.length || 0) +
        (libraryStore.selectedFormats?.length || 0) +
        (libraryStore.selectedStatuses?.length || 0) +
        (libraryStore.selectedCollections?.length || 0) +
        (libraryStore.selectedReadingStatuses?.length || 0) +
        (libraryStore.sort !== "popular" && libraryStore.sort ? 1 : 0);

  const hasAnyFilter =
    dynamicFilters.sorts.length > 0 ||
    dynamicFilters.formats.length > 0 ||
    dynamicFilters.statuses.length > 0 ||
    dynamicFilters.genres.length > 0;

  return (
    <FilterDrawerShell
      title="Filter Pencarian"
      description="Pilih urutan, status, dan genre yang ingin kamu lihat."
      activeCount={activeCount}
      onApply={handleApply}
      onReset={handleReset}
      onOpen={syncFromStore}
      trigger={effectiveTrigger}
    >
      {!hasAnyFilter ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-raised flex items-center justify-center mb-3 text-text-muted">
            <Funnel size={24} weight="duotone" />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            Sumber ini tidak menyediakan filter tambahan
          </p>
          <p className="text-xs text-text-muted mt-1 max-w-[280px] leading-relaxed">
            Kamu tetap bisa mencari judul lewat kolom di atas.
          </p>
        </div>
      ) : (
        <>
          {/* Urutkan — active state uses accent-solid red per 07-component-buttons.md */}
          {dynamicFilters.sorts.length > 0 && (
            <FilterSection title="Urutkan">
              {dynamicFilters.sorts.map((sort: any) => {
                const isSelected = selectedSort === sort.id;
                return (
                  <FilterChip
                    key={sort.id}
                    onClick={() => setSelectedSort(sort.id)}
                    selected={isSelected}
                    variant={isSelected ? "accent-solid" : "default"}
                    label={sort.label}
                  />
                );
              })}
            </FilterSection>
          )}

          {/* Tipe / Format */}
          {dynamicFilters.formats.length > 0 && (
            <FilterSection title="Tipe Komik">
              {dynamicFilters.formats.map((format: any) => {
                const isSelected = selectedFormats.includes(format.id);
                return (
                  <FilterChip
                    key={format.id}
                    onClick={() => toggleFormat(format.id)}
                    selected={isSelected}
                    variant={isSelected ? "accent-subtle" : "default"}
                    showCheck={isSelected}
                    label={format.label}
                  />
                );
              })}
            </FilterSection>
          )}

          {/* Status Rilis — UNIFIED section title for both search and library */}
          {dynamicFilters.statuses.length > 0 && (
            <FilterSection title="Status Rilis">
              {dynamicFilters.statuses.map((status: any) => {
                const isSelected = selectedStatus.includes(status.id);
                return (
                  <FilterChip
                    key={status.id}
                    onClick={() => toggleStatus(status.id)}
                    selected={isSelected}
                    variant={isSelected ? "accent-subtle" : "default"}
                    showCheck={isSelected}
                    label={status.label}
                  />
                );
              })}
            </FilterSection>
          )}

          {/* Genre — Standardized compact auto-width wrap-chip layout across both contexts */}
          {dynamicFilters.genres.length > 0 && (
            <FilterSection title="Genre" layout="wrap">
              {dynamicFilters.genres.map((genre: any) => {
                if (context === "search") {
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
                } else {
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
                }
              })}
            </FilterSection>
          )}

          {/* Koleksi (Lokal) — Library context only */}
          {context === "library" && collections.length > 0 && (
            <FilterSection title="Koleksi (Lokal)">
              {collections.map((col: any) => {
                const isSelected = selectedCollections.includes(col.id);
                return (
                  <FilterChip
                    key={col.id}
                    onClick={() => toggleCollection(col.id)}
                    selected={isSelected}
                    variant={isSelected ? "accent-subtle" : "default"}
                    showCheck={isSelected}
                    label={col.name}
                  />
                );
              })}
            </FilterSection>
          )}

          {/* Status Membaca (Lokal) — Library context only */}
          {context === "library" && (
            <FilterSection title="Status Membaca (Lokal)">
              {LOCAL_READING_STATUSES.map((status: any) => {
                const isSelected = selectedReadingStatuses.includes(status.id);
                return (
                  <FilterChip
                    key={status.id}
                    onClick={() => toggleReadingStatus(status.id)}
                    selected={isSelected}
                    variant={isSelected ? "accent-subtle" : "default"}
                    showCheck={isSelected}
                    label={status.label}
                  />
                );
              })}
            </FilterSection>
          )}
        </>
      )}
    </FilterDrawerShell>
  );
}
