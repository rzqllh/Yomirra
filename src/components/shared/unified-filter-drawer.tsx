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
import { canonicalizeFilterValue, parseSearchExpression, resolveSearchTag, type SearchTagCategory } from "@/shared/lib/search-intelligence";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import type { FilterList, SourceMetadata } from "@/shared/sources/source-types";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";

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

const LOCAL_READING_STATUSES = [
  { id: "reading", label: "Sedang Dibaca" },
  { id: "completed", label: "Selesai" },
  { id: "on-hold", label: "Ditunda" },
  { id: "dropped", label: "Dihentikan" },
  { id: "plan-to-read", label: "Akan Dibaca" },
];

function isCatchAllOption(id: string, label: string) {
  const value = normalizeTitle(`${id} ${label}`).replace(/\s+/g, "");
  return ["all", "alltypes", "alltype", "allstatus", "semua", "semuatipe", "semuastatus"].some(
    (token) => value === token || value.startsWith(token)
  );
}

function normalizeSourceOptions(
  items: Array<{ id: string; name: string }> | undefined,
  category: SearchTagCategory
) {
  const merged = new Map<string, { id: string; label: string; canonicalId: string }>();
  for (const item of items ?? []) {
    if (isCatchAllOption(item.id, item.name)) continue;
    const canonical = canonicalizeFilterValue(category, item.id, item.name);
    if (!merged.has(canonical.id)) {
      merged.set(canonical.id, {
        id: item.id,
        label: canonical.label,
        canonicalId: canonical.id,
      });
    }
  }

  const options = Array.from(merged.values());
  if (category !== "genre") return options;

  const canonicalIds = new Set(options.map((option) => option.canonicalId));
  return options.filter((option) => {
    const words = normalizeTitle(option.label).split(" ").filter(Boolean);
    if (words.length < 2) return true;
    const resolved = words
      .map((word) => resolveSearchTag(word))
      .filter((tag) => tag?.category === "genre")
      .map((tag) => tag!.id);
    const unique = Array.from(new Set(resolved));
    return unique.length < 2 || !unique.every((id) => canonicalIds.has(id));
  });
}

function normalizeSortOptions(items: Array<{ id: string; name: string }> | undefined) {
  const source = items ?? [];
  const aliases = [
    { id: "popular", label: "Populer", terms: ["popular", "populer", "popularity"] },
    { id: "latest", label: "Terbaru", terms: ["latest", "update", "latest update", "terbaru"] },
    { id: "rating", label: "Rating Tertinggi", terms: ["rating", "highest rating", "rating tertinggi"] },
    { id: "alphabetical", label: "A-Z", terms: ["a-z", "alphabetical", "alphabet", "title asc"] },
    { id: "reverse-alphabetical", label: "Z-A", terms: ["z-a", "title desc"] },
  ];
  const seen = new Set<string>();
  return source.flatMap((item) => {
    if (isCatchAllOption(item.id, item.name)) return [];
    const normalized = normalizeTitle(`${item.id} ${item.name}`);
    const match = aliases.find((alias) => alias.terms.some((term) => normalized.includes(term)));
    const key = match?.id ?? normalizeTitle(item.id || item.name);
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [{ id: item.id, label: match?.label ?? item.name }];
  });
}

export interface UnifiedFilterDrawerProps {
  context: "search" | "library";
  activeSourceId?: string;
  searchQuery?: string;
  onResetRouteIntent?: () => void;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function UnifiedFilterDrawer({
  context,
  activeSourceId = "",
  searchQuery = "",
  onResetRouteIntent,
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
  const [localSources, setLocalSources] = React.useState<SourceMetadata[]>([]);

  // ----------------------------------------------------
  // Dynamic Sources & Filters for Search context
  // ----------------------------------------------------
  React.useEffect(() => {
    const loadLocal = () => setLocalSources(dynamicSourceRegistry.getAll());
    loadLocal();
    const handleUpdate = () => loadLocal();
    window.addEventListener("sources_updated", handleUpdate);
    return () => window.removeEventListener("sources_updated", handleUpdate);
  }, []);

  const { data: sourcesData } = useQuery(sourceQueryOptions);

  const allSources = React.useMemo(() => {
    const sources = [...(sourcesData || [])];
    localSources.forEach((localSource) => {
      if (!sources.some((source) => source.id === localSource.id)) {
        sources.push(localSource);
      }
    });
    return sources;
  }, [sourcesData, localSources]);

  const searchableSources = React.useMemo(() => {
    if (context !== "search") return [];

    return allSources.filter((item) => {
      if (!item.isInstalled || item.isEnabled === false || !item.capabilities?.search) return false;
      if (item.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [context, allSources, hideNsfw]);

  const activeSelectedSources = searchStore.selectedSources || [];
  const sourcesToFetch =
    activeSelectedSources.length > 0
      ? searchableSources.filter((source) => activeSelectedSources.includes(source.id))
      : searchableSources;
  const filterSourcesToFetch = sourcesToFetch.filter(
    (source) => source.capabilities?.filters === true
  );

  const searchFiltersQueries = useQueries({
    queries: (context === "search" ? filterSourcesToFetch : []).map((source) => ({
      queryKey: ["filters", source.id],
      queryFn: () => apiClient.getFilters(source.id),
      staleTime: Infinity,
    })),
  });

  // ----------------------------------------------------
  // Single Source Filters for Library context
  // ----------------------------------------------------
  const activeLibrarySource = allSources.find((source) => source.id === activeSourceId);
  const supportsLibraryProviderFilters =
    activeLibrarySource?.capabilities?.filters === true;

  const { data: libraryFiltersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
    staleTime: Infinity,
    enabled:
      context === "library" &&
      Boolean(activeSourceId) &&
      supportsLibraryProviderFilters,
  });

  // ----------------------------------------------------
  // Unified Dynamic Filters with NSFW filtering applied
  // ----------------------------------------------------
  const dynamicFilters = React.useMemo(() => {
    if (context === "search") {
      const sourceFilters = filterSourcesToFetch
        .map((source, idx) => ({
          sourceId: source.id,
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
      const normalizedGenres = normalizeSourceOptions(libraryFiltersData?.genres, "genre");
      const safeGenres = hideNsfw
        ? normalizedGenres.filter((genre) => !isNsfwGenre(genre))
        : normalizedGenres;
      const statuses = normalizeSourceOptions(libraryFiltersData?.statuses, "status");
      const formats = normalizeSourceOptions(libraryFiltersData?.formats, "format");
      const sorts = normalizeSortOptions(libraryFiltersData?.sorts);

      return {
        genres: safeGenres,
        statuses,
        sorts,
        formats,
      };
    }
  }, [context, filterSourcesToFetch, searchFiltersQueries, libraryFiltersData, hideNsfw]);

  const searchTagIntent = React.useMemo(() => {
    if (context !== "search" || !searchQuery.trim()) {
      return { genres: [] as string[], formats: [] as string[], status: "" };
    }

    const positiveTags = parseSearchExpression(searchQuery, dynamicFilters).tags.filter(
      (tag) => tag.operator !== "exclude"
    );

    return {
      genres: positiveTags
        .filter((tag) => tag.category === "genre")
        .map((tag) => tag.id),
      formats: positiveTags
        .filter((tag) => tag.category === "format")
        .map((tag) => tag.id),
      status:
        positiveTags.find((tag) => tag.category === "status")?.id ?? "",
    };
  }, [context, searchQuery, dynamicFilters]);

  // Sync state when drawer opens
  const syncFromStore = () => {
    if (context === "search") {
      setSelectedGenres(
        Array.from(new Set([...searchStore.genres, ...searchTagIntent.genres]))
      );
      setSelectedFormats(
        Array.from(new Set([...(searchStore.formats || []), ...searchTagIntent.formats]))
      );
      setSelectedStatus(
        searchTagIntent.status
          ? [searchTagIntent.status]
          : searchStore.status
            ? [searchStore.status]
            : []
      );
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
      const persistedGenres = selectedGenres.filter(
        (id) => !searchTagIntent.genres.includes(id) || searchStore.genres.includes(id)
      );
      const persistedFormats = selectedFormats.filter(
        (id) =>
          !searchTagIntent.formats.includes(id) ||
          (searchStore.formats || []).includes(id)
      );
      const selectedStatusValue = selectedStatus[0] || "";
      const persistedStatus =
        selectedStatusValue === searchTagIntent.status &&
        searchStore.status !== searchTagIntent.status
          ? searchStore.status
          : selectedStatusValue;

      searchStore.applyFilters({
        genres: persistedGenres,
        formats: persistedFormats,
        status: persistedStatus,
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

    if (context === "search") {
      searchStore.resetFilters();
    } else {
      libraryStore.setFilters({
        selectedGenres: [],
        excludedGenres: [],
        selectedFormats: [],
        selectedStatuses: [],
        selectedCollections: [],
        selectedReadingStatuses: [],
        sort: "popular",
      });
    }

    onResetRouteIntent?.();
  };

  const searchActiveCount =
    new Set([...searchStore.genres, ...searchTagIntent.genres]).size +
    new Set([...(searchStore.formats || []), ...searchTagIntent.formats]).size +
    (searchTagIntent.status || searchStore.status ? 1 : 0) +
    (searchStore.sort !== "popular" && searchStore.sort ? 1 : 0);

  const activeCount =
    context === "search"
      ? searchActiveCount
      : (libraryStore.selectedGenres?.length || 0) +
        (libraryStore.excludedGenres?.length || 0) +
        (libraryStore.selectedFormats?.length || 0) +
        (libraryStore.selectedStatuses?.length || 0) +
        (libraryStore.selectedCollections?.length || 0) +
        (libraryStore.selectedReadingStatuses?.length || 0) +
        (libraryStore.sort !== "popular" && libraryStore.sort ? 1 : 0);

  const hasProviderFilter =
    dynamicFilters.sorts.length > 0 ||
    dynamicFilters.formats.length > 0 ||
    dynamicFilters.statuses.length > 0 ||
    dynamicFilters.genres.length > 0;
  const hasLocalLibraryFilter =
    context === "library" &&
    (collections.length > 0 || LOCAL_READING_STATUSES.length > 0);
  const hasAnyFilter = hasProviderFilter || hasLocalLibraryFilter;

  return (
    <FilterDrawerShell
      title={context === "search" ? "Filter Pencarian" : "Filter Library"}
      description="Atur urutan, tipe, status, dan genre yang mau ditampilkan."
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
