"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";
import { selectDiscoverySources } from "@/shared/sources/discovery-source-policy";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaKey } from "@/shared/types/collection";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";

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
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources);
  const isNsfwFiltered = useSettingsStore((state) => state.hideNsfw);
  const { data: runtimeSources } = useQuery(sourceQueryOptions);

  const sourceParam = searchParams.get("source");
  const genreParams = React.useMemo(
    () => searchParams.getAll("genre").map(g => g.toLowerCase().replace(/\s+/g, "-")),
    [searchParams]
  );
  const eligibleSources = React.useMemo(
    () =>
      selectDiscoverySources(runtimeSources || [], disabledSources).filter(
        (source) => !(isNsfwFiltered && source.isNsfw)
      ),
    [runtimeSources, disabledSources, isNsfwFiltered]
  );
  const activeSourceId =
    sourceParam || eligibleSources[0]?.id || "shinigami";
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
  const {
    collections,
    membershipsByManga,
    readingStatusByManga,
    getMemberships,
    getResolvedReadingStatus,
  } = useCollectionStore();

  const initialSort = sortParam || storeSort || "popular";

  const [searchInput, setSearchInput] = React.useState(storeQuery);
  const [query, setQuery] = React.useState(storeQuery);
  const [sort, setSort] = React.useState<string>(initialSort);
  const [page, setPage] = React.useState(1);

  const genreSignature = genreParams.join("|");
  const previousSourceRef = React.useRef(activeSourceId);

  // A direct reload clears session-scoped filters, but explicit URL tags remain an intent
  // and are applied again immediately below.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type !== "reload") return;

    filterStore.resetFilters();
    setSearchInput("");
    setQuery("");
    setSort(sortParam || "popular");
  }, []);

  // Provider filter values are source-specific. Clear them when the source changes,
  // then synchronize any genre/tag route coming from the manga detail chips.
  React.useEffect(() => {
    const sourceChanged = previousSourceRef.current !== activeSourceId;
    const nextGenres = genreParams;

    if (sourceChanged) {
      previousSourceRef.current = activeSourceId;
      filterStore.setFilters({
        selectedGenres: nextGenres,
        excludedGenres: [],
        selectedFormats: [],
        selectedStatuses: [],
      });
      setPage(1);
      return;
    }

    if (nextGenres.length > 0) {
      const current = selectedGenres.join("|");
      if (current !== genreSignature || excludedGenres.length > 0) {
        filterStore.setFilters({
          selectedGenres: nextGenres,
          excludedGenres: [],
        });
        setPage(1);
      }
    }
  }, [activeSourceId, genreSignature]);

  const { data: sourcesData } = useQuery(sourceQueryOptions);
  const activeSourceMetadata = React.useMemo(
    () =>
      dynamicSourceRegistry.get(activeSourceId) ||
      sourcesData?.find((source) => source.id === activeSourceId),
    [activeSourceId, sourcesData]
  );

  const { isSourceDisabled } = useSourcePreferencesStore();
  const isDown = activeSourceMetadata?.status === "unavailable";
  const isDisabled = isSourceDisabled(activeSourceId) || isDown;
  const supportsProviderFilters =
    activeSourceMetadata?.capabilities?.filters === true;

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
    staleTime: 1000 * 60 * 15,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !isDisabled && supportsProviderFilters,
  });

  React.useEffect(() => {
    if (!activeSourceMetadata || supportsProviderFilters) return;
    if (
      selectedGenres.length === 0 &&
      excludedGenres.length === 0 &&
      selectedFormats.length === 0 &&
      selectedStatuses.length === 0
    ) {
      return;
    }

    filterStore.setFilters({
      selectedGenres: [],
      excludedGenres: [],
      selectedFormats: [],
      selectedStatuses: [],
    });
    setPage(1);
  }, [
    activeSourceMetadata,
    supportsProviderFilters,
    selectedGenres,
    excludedGenres,
    selectedFormats,
    selectedStatuses,
    filterStore,
  ]);


  const DYNAMIC_SORTS = filtersData?.sorts?.length ? filtersData.sorts : [
    { id: "popular", name: "Populer" },
    { id: "latest", name: "Terbaru" },
    { id: "rating", name: "Rating Tertinggi" },
    { id: "alphabetical", name: "A-Z" },
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
      }

      // Rating and alphabetical ordering are applied client-side so they work
      // consistently even when a provider has no native sort support.
      const res = await apiClient.getPopular(activeSourceId, currentPage);
      return { mangas: res.mangas, hasNextPage: !!res.hasNextPage };
    }

    const filters: Record<string, string | string[]> = {};
    if (sort === "latest") filters.sort = "latest";
    else if (sort === "popular" || sort === "all") filters.sort = "popularity";

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
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  const resetFilterRouteIntent = React.useCallback(() => {
    setSort("popular");
    setPage(1);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("genre");
    params.delete("sort");
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const resetFilters = () => {
    filterStore.resetFilters();
    setQuery("");
    setSearchInput("");
    setSort("popular");
    setPage(1);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("genre");
    params.delete("sort");
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  };

  const activeFilterCount =
    selectedGenres.length +
    excludedGenres.length +
    selectedFormats.length +
    selectedStatuses.length +
    selectedCollections.length +
    selectedReadingStatuses.length +
    (sort !== "popular" && sort !== "all" ? 1 : 0);
  const rawMangas = data?.mangas || [];
  const uniqueMangas = React.useMemo(() => {
    return Array.from(new Map(rawMangas.map(m => [m.id, m])).values());
  }, [rawMangas]);

  const mangas = React.useMemo(() => {
    let result = [...uniqueMangas];

    if (selectedCollections.length > 0) {
      result = result.filter((manga) => {
        const key = `${activeSourceId}::${manga.id}` as MangaKey;
        const memberships = getMemberships(key);
        return selectedCollections.some((collectionId) => memberships.includes(collectionId));
      });
    }

    if (selectedReadingStatuses.length > 0) {
      result = result.filter((manga) => {
        const key = `${activeSourceId}::${manga.id}` as MangaKey;
        const readingStatus = getResolvedReadingStatus(key);
        return Boolean(readingStatus && selectedReadingStatuses.includes(readingStatus));
      });
    }

    if (sort === "alphabetical" || sort === "alphabet" || sort === "title") {
      return result.sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""), "id", { sensitivity: "base" })
      );
    }

    if (sort !== "rating") return result;

    return result.sort((a, b) => {
      const scoreA = typeof a.score === "number" && !isNaN(a.score) && a.score > 0 ? a.score : -1;
      const scoreB = typeof b.score === "number" && !isNaN(b.score) && b.score > 0 ? b.score : -1;

      if (scoreA === -1 && scoreB === -1) return 0;
      if (scoreA === -1) return 1;
      if (scoreB === -1) return -1;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const rankA = a.rank ?? 0;
      const rankB = b.rank ?? 0;
      return rankB - rankA;
    });
  }, [
    uniqueMangas,
    sort,
    activeSourceId,
    selectedCollections,
    selectedReadingStatuses,
    getMemberships,
    getResolvedReadingStatus,
  ]);

  const listingViewMode = useSettingsStore(state => state.listingViewMode);
  const setListingViewMode = useSettingsStore(state => state.setListingViewMode);

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
    viewMode: listingViewMode,
    setViewMode: setListingViewMode,
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
    resetFilterRouteIntent,
    resetFilters,
  };
}
