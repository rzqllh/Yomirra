"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaKey } from "@/shared/types/collection";

const FORMATS = [
  { id: "manga", name: "Manga" },
  { id: "manhwa", name: "Manhwa" },
  { id: "manhua", name: "Manhua" },
];

const STATUSES = [
  { id: "ongoing", name: "Ongoing" },
  { id: "completed", name: "Completed" },
  { id: "hiatus", name: "Hiatus" },
];

export function useLibraryCatalog() {
  const isMounted = useMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sourceParam = searchParams.get("source");
  const genreParams = React.useMemo(
    () => searchParams.getAll("genre").map(g => g.toLowerCase().replace(/\s+/g, "-")),
    [searchParams]
  );
  const activeSourceId = sourceParam || "shinigami";
  const sortParam = searchParams.get("sort");

  const filterStore = useLibraryFilterStore();
  const {
    selectedGenres,
    excludedGenres,
    selectedFormats,
    selectedStatuses,
    selectedCollections,
    selectedReadingStatuses,
    sort: storeSort,
    query: storeQuery,
    viewMode,
  } = filterStore;

  const libraryItems = useLibraryStore(state => state.items);
  const { collections, membershipsByManga, readingStatusByManga, getMemberships } = useCollectionStore();

  const initialSort = sortParam || storeSort || "popular";

  const [searchInput, setSearchInput] = React.useState(storeQuery);
  const [query, setQuery] = React.useState(storeQuery);
  const [sort, setSort] = React.useState<string>(initialSort);
  const [page, setPage] = React.useState(1);

  // Sync initial URL params or reset on page reload
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === "reload") {
        filterStore.resetFilters();
        setSearchInput("");
        setQuery("");
      } else if (genreParams.length > 0 && selectedGenres.length === 0 && excludedGenres.length === 0) {
        filterStore.setFilters({ selectedGenres: genreParams });
      }
    }
  }, []);

  const { isSourceDisabled } = useSourcePreferencesStore();
  const sourceObj = dynamicSourceRegistry.get(activeSourceId);
  const isDown = sourceObj?.status === "unavailable";
  const isDisabled = isSourceDisabled(activeSourceId) || isDown;

  const deferredSearchInput = React.useDeferredValue(searchInput);

  React.useEffect(() => {
    if (deferredSearchInput !== query) {
      setQuery(deferredSearchInput.trim());
      filterStore.setFilters({ query: deferredSearchInput.trim() });
      setPage(1);
    }
  }, [deferredSearchInput, query]);

  const { data: filtersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isNsfwFiltered = useSettingsStore(state => state.hideNsfw);

  const DYNAMIC_SORTS = filtersData?.sorts || [
    { id: "popular", name: "🔥 Populer" },
    { id: "latest", name: "✨ Terbaru" },
  ];

  // Fallback to supported sort if current sort is not available in the new source
  React.useEffect(() => {
    if (filtersData?.sorts) {
      const isSupported = filtersData.sorts.some(s => s.id === sort);
      if (!isSupported && filtersData.sorts.length > 0) {
        setSort(filtersData.sorts[0].id);
      }
    }
  }, [filtersData?.sorts, sort]);

  // Sync local sort state with storeSort
  React.useEffect(() => {
    if (storeSort && storeSort !== sort) {
      setSort(storeSort);
      const params = new URLSearchParams(searchParams.toString());
      if (storeSort === "all" || storeSort === "popular") {
        params.delete("sort");
      } else {
        params.set("sort", storeSort);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [storeSort, sort, pathname, router, searchParams]);

  // Reset page to 1 when filters change from drawer
  const previousFiltersRef = React.useRef({ selectedGenres, excludedGenres, selectedFormats, selectedStatuses, selectedCollections, selectedReadingStatuses, storeSort });
  React.useEffect(() => {
    const prev = previousFiltersRef.current;
    if (
      prev.storeSort !== storeSort ||
      prev.selectedGenres !== selectedGenres ||
      prev.excludedGenres !== excludedGenres ||
      prev.selectedFormats !== selectedFormats ||
      prev.selectedStatuses !== selectedStatuses ||
      prev.selectedCollections !== selectedCollections ||
      prev.selectedReadingStatuses !== selectedReadingStatuses
    ) {
      setPage(1);
      previousFiltersRef.current = { selectedGenres, excludedGenres, selectedFormats, selectedStatuses, selectedCollections, selectedReadingStatuses, storeSort };
    }
  }, [selectedGenres, excludedGenres, selectedFormats, selectedStatuses, selectedCollections, selectedReadingStatuses, storeSort]);

  const fetchCatalog = async (currentPage: number) => {
    const hasFilters = selectedGenres.length > 0 || excludedGenres.length > 0 || selectedFormats.length > 0 || selectedStatuses.length > 0;

    if (!query && !hasFilters) {
      if (sort === "latest") {
        const res = await apiClient.getLatest(activeSourceId, currentPage);
        return { mangas: res.mangas, hasNextPage: !!res.hasNextPage };
      } else if (sort === "popular" || sort === "all") {
        const res = await apiClient.getPopular(activeSourceId, currentPage);
        return { mangas: res.mangas, hasNextPage: !!res.hasNextPage };
      }
    }

    const filters: Record<string, string | string[]> = {};
    if (sort === "latest") filters.sort = "latest";
    else if (sort === "popular" || sort === "all") filters.sort = "popularity";
    else filters.sort = sort;

    if (selectedGenres.length > 0 || excludedGenres.length > 0) {
      const genreParams: string[] = [];
      selectedGenres.forEach(g => genreParams.push(g));
      excludedGenres.forEach(g => genreParams.push(`-${g}`));
      if (genreParams.length > 0) filters["genre[]"] = genreParams;
    }

    if (selectedFormats.length > 0) filters["format"] = selectedFormats.join(",");
    if (selectedStatuses.length > 0) filters["status"] = selectedStatuses.join(",");

    const res = await apiClient.search(activeSourceId, query, currentPage, filters, isNsfwFiltered);
    return { mangas: res.results, hasNextPage: !!res.hasNextPage };
  };

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["library-v2", activeSourceId, query, sort, selectedGenres, excludedGenres, selectedFormats, selectedStatuses, selectedCollections, selectedReadingStatuses, page, isNsfwFiltered],
    queryFn: () => fetchCatalog(page),
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !isDisabled,
    placeholderData: keepPreviousData,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
  };

  const handleTabChange = (newSort: string) => {
    setSort(newSort);
    filterStore.setFilters({ sort: newSort });
    setPage(1);

    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "all" || newSort === "popular") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    filterStore.resetFilters();
    setQuery("");
    setSearchInput("");
    setSort("popular");
    setPage(1);
  };

  const activeFilterCount = selectedGenres.length + excludedGenres.length + selectedFormats.length + selectedStatuses.length + selectedCollections.length + selectedReadingStatuses.length;
  const rawMangas = data?.mangas || [];
  const mangas = Array.from(new Map(rawMangas.map(m => [m.id, m])).values());

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const totalLibraryCount = Object.keys(libraryItems).length;

  return {
    isMounted,
    activeSourceId,
    searchInput,
    setSearchInput,
    query,
    setQuery,
    sort,
    page,
    setPage,
    viewMode,
    isDisabled,
    isLoading,
    isError,
    isFetching,
    refetch,
    data,
    mangas,
    activeFilterCount,
    totalLibraryCount,
    DYNAMIC_SORTS,
    collections,
    libraryItems,
    membershipsByManga,
    getMemberships,
    selectedReadingStatuses,
    selectedCollections,
    selectedGenres,
    excludedGenres,
    selectedFormats,
    selectedStatuses,
    filterStore,
    handleSearchSubmit,
    handleTabChange,
    resetFilters,
  };
}
