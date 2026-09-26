"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueries, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useSearchPruning } from "@/shared/hooks/use-search-pruning";
import { useSearchReset } from "@/shared/hooks/use-search-reset";
import { mergeFilters, buildPayloadForSource } from "@/shared/utils/filter-helpers";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { clusterCanonicalResults, type SourceBinding } from "@/shared/lib/canonical-search";
import type { FilterList, SourceMetadata } from "@/shared/sources/source-types";

export function useSearchCatalog() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const [localQuery, setLocalQuery] = React.useState(query);
  const [page, setPage] = React.useState(1);
  const router = useRouter();

  React.useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const debouncedQuery = useDebounce(localQuery, 800);

  React.useEffect(() => {
    if (debouncedQuery !== query) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (debouncedQuery.trim() === "") {
        params.delete("q");
      } else {
        params.set("q", debouncedQuery.trim());
      }
      setPage(1);
      router.push(`/search?${params.toString()}`);
    }
  }, [debouncedQuery, query, router, searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() !== query) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("q", localQuery.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  const [localSources, setLocalSources] = React.useState<SourceMetadata[]>([]);

  const loadLocalSources = React.useCallback(() => {
    setLocalSources(dynamicSourceRegistry.getAll());
  }, []);

  React.useEffect(() => {
    loadLocalSources();
    const handleUpdate = () => loadLocalSources();
    window.addEventListener("sources_updated", handleUpdate);
    return () => window.removeEventListener("sources_updated", handleUpdate);
  }, [loadLocalSources]);

  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const disabledSources = useSourcePreferencesStore(state => state.disabledSources);

  const searchableSources = React.useMemo(() => {
    const s = [...(sourcesData || [])];
    localSources.forEach(ls => {
      if (!s.find(x => x.id === ls.id)) {
        s.push(ls);
      }
    });
    return s.filter(src => {
      if (!src.isInstalled || src.isEnabled === false || !src.capabilities?.search) return false;
      if (disabledSources.includes(src.id)) return false;
      if (src.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [sourcesData, localSources, hideNsfw, disabledSources]);

  const searchFilterStore = useSearchFilterStore();
  const selectedSources = searchFilterStore.selectedSources;
  const hasCustomizedSources = searchFilterStore.hasCustomizedSources;

  const activeSelectedSources = React.useMemo(() => {
    if (!searchableSources.length) return [];
    if (!hasCustomizedSources || selectedSources === null) {
      return searchableSources.map(s => s.id);
    }
    return selectedSources.filter((id: string) => searchableSources.some(s => s.id === id));
  }, [hasCustomizedSources, selectedSources, searchableSources]);

  const toggleSource = (id: string) => {
    searchFilterStore.toggleSource(id, searchableSources.map(s => s.id));
  };

  const isNsfwFiltered = useSettingsStore((state) => state.hideNsfw);

  const genres = searchFilterStore.genres;
  const formats = searchFilterStore.formats;
  const status = searchFilterStore.status;
  const sort = searchFilterStore.sort;

  const filtersQueries = useQueries({
    queries: activeSelectedSources.map((sourceId: string) => ({
      queryKey: ["sourceFilters", sourceId],
      queryFn: (): Promise<FilterList> => apiClient.getFilters(sourceId),
      staleTime: 5 * 60 * 1000,
    }))
  });

  const isFiltersLoading = filtersQueries.some(q => q.isLoading || q.isFetching);
  const hasFiltersError = filtersQueries.some(q => q.isError);
  const isCapabilitiesLoaded = filtersQueries.filter(q => q.isSuccess).length === activeSelectedSources.length;

  const dynamicFilters = React.useMemo(() => {
    const sourceFilters = activeSelectedSources.flatMap((sourceId: string, idx: number) => {
      const filters = filtersQueries[idx]?.data;
      return filters ? [{ sourceId, filters }] : [];
    });

    return mergeFilters(sourceFilters);
  }, [activeSelectedSources, filtersQueries]);

  useSearchPruning({
    activeSelectedSources,
    isStillLoading: isFiltersLoading,
    hasError: hasFiltersError,
    isCapabilitiesLoaded,
    dynamicFilters,
    pruneFilters: searchFilterStore.pruneFilters
  });

  useSearchReset({
    activeSelectedSources,
    genres,
    formats,
    status,
    sort,
    query,
    setPage
  });

  const activeFilters = React.useMemo(() => ({ genres, formats, status, sort }), [genres, formats, status, sort]);

  const queryClient = useQueryClient();

  const searchQueries = useQueries({
    queries: activeSelectedSources.map((sourceId: string) => {
      const sourceMeta = searchableSources.find((s) => s.id === sourceId);
      const isUnreachable = sourceMeta?.status === "unavailable" || sourceMeta?.status === "in-fix";
      const payload = buildPayloadForSource(sourceId, dynamicFilters, activeFilters);

      let isExhausted = false;
      for (let p = 1; p < page; p++) {
        const prevData = queryClient.getQueryData<{ hasNextPage?: boolean }>(
          ["searchSource", sourceId, query, isNsfwFiltered, payload, p]
        );
        if (prevData && prevData.hasNextPage === false) {
          isExhausted = true;
          break;
        }
      }

      return {
        queryKey: ["searchSource", sourceId, query, isNsfwFiltered, payload, page],
        queryFn: ({ signal }: { signal?: AbortSignal }) => apiClient.search(sourceId, query, page, payload, isNsfwFiltered, { signal }),
        enabled: activeSelectedSources.length > 0 && !isExhausted && !isUnreachable,
        placeholderData: keepPreviousData,
      };
    })
  });

  const resultsBySource = React.useMemo(() => {
    const acc: Record<string, { results: any[]; hasNextPage?: boolean; error?: string }> = {};
    activeSelectedSources.forEach((sourceId: string, idx: number) => {
      const sourceMeta = searchableSources.find((s) => s.id === sourceId);
      const isUnreachable = sourceMeta?.status === "unavailable" || sourceMeta?.status === "in-fix";

      if (isUnreachable) {
        acc[sourceId] = {
          error: `Sumber sedang mengalami gangguan (${sourceMeta?.status === "in-fix" ? "dalam perbaikan" : "tidak tersedia"})`,
          results: [],
        };
        return;
      }

      const q = searchQueries[idx];
      if (q?.data) {
        acc[sourceId] = {
          results: q.data.results || [],
          hasNextPage: q.data.hasNextPage,
        };
      } else if (q?.error) {
        acc[sourceId] = {
          error: (q.error as Error).message || "Error",
          results: [],
        };
      } else {
        const payload = buildPayloadForSource(sourceId, dynamicFilters, activeFilters);
        let isExhausted = false;
        for (let p = 1; p < page; p++) {
          const prevData = queryClient.getQueryData<{ hasNextPage?: boolean }>(
            ["searchSource", sourceId, query, isNsfwFiltered, payload, p]
          );
          if (prevData && prevData.hasNextPage === false) {
            isExhausted = true;
            break;
          }
        }
        if (isExhausted) {
          acc[sourceId] = {
            results: [],
            hasNextPage: false,
          };
        }
      }
    });
    return acc;
  }, [activeSelectedSources, searchQueries, queryClient, dynamicFilters, activeFilters, page, query, isNsfwFiltered, searchableSources]);

  const getMergedMangas = (sourceArrays: { sourceId: string, items: any[] }[]) => {
    const flattened: Array<{ manga: any; sourceId: string }> = [];

    let maxLen = 0;
    sourceArrays.forEach(arr => {
      if (arr.items.length > maxLen) maxLen = arr.items.length;
    });

    for (let i = 0; i < maxLen; i++) {
      for (const arr of sourceArrays) {
        if (arr.items[i]) {
          flattened.push({ manga: arr.items[i], sourceId: arr.sourceId });
        }
      }
    }

    const clusters = clusterCanonicalResults(flattened);
    return clusters.map(c => ({
      manga: c.primaryResult,
      sourceId: c.primaryResult.sourceId,
      sourceBindings: c.sourceBindings,
    }));
  };

  const rawSearchMangas = React.useMemo(() => {
    return resultsBySource ? getMergedMangas(
      Object.entries(resultsBySource).map(([sourceId, res]) => ({
        sourceId,
        items: res.results || []
      }))
    ) : [];
  }, [resultsBySource]);

  const searchMangas = React.useMemo(() => {
    if (sort !== "rating") return rawSearchMangas;
    return [...rawSearchMangas].sort((a, b) => {
      const scoreA = typeof a.manga.score === "number" && a.manga.score > 0 ? a.manga.score : -1;
      const scoreB = typeof b.manga.score === "number" && b.manga.score > 0 ? b.manga.score : -1;

      // Null-last: unrated titles are kept at the bottom of the list
      if (scoreA === -1 && scoreB === -1) return 0;
      if (scoreA === -1) return 1;
      if (scoreB === -1) return -1;

      // Primary sort: descending by rating
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Tie-break fallback to popularity/rank
      const rankA = a.manga.rank ?? 0;
      const rankB = b.manga.rank ?? 0;
      return rankB - rankA;
    });
  }, [rawSearchMangas, sort]);

  const hasNextPage = Object.values(resultsBySource || {}).some((res: any) => res.hasNextPage);

  const errorsToDisplay = resultsBySource
    ? (Object.entries(resultsBySource)
        .map(([sourceId, res]) => res.error ? { sourceId, error: res.error } : null)
        .filter(Boolean) as { sourceId: string; error: string }[])
    : [];

  const isInitialLoading = searchQueries.some(q => q.fetchStatus === "fetching" && !q.data);
  const allSourcesFailed = activeSelectedSources.length > 0 && errorsToDisplay.length === activeSelectedSources.length;
  const hasActiveFilters = genres.length > 0 || (formats && formats.length > 0) || Boolean(status) || (Boolean(sort) && sort !== "popular");

  return {
    localQuery,
    setLocalQuery,
    query,
    page,
    setPage,
    searchableSources,
    activeSelectedSources,
    toggleSource,
    searchMangas,
    hasNextPage,
    errorsToDisplay,
    isInitialLoading,
    allSourcesFailed,
    hasActiveFilters,
    handleSearchSubmit,
    queryClient,
  };
}
