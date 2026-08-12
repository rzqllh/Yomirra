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

  const searchableSources = React.useMemo(() => {
    const s = [...(sourcesData || [])];
    localSources.forEach(ls => {
      if (!s.find(x => x.id === ls.id)) {
        s.push(ls);
      }
    });
    return s.filter(src => {
      if (!src.isInstalled || !src.capabilities?.search) return false;
      if (src.status !== "online") return false;
      if (src.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [sourcesData, localSources, hideNsfw]);

  const searchFilterStore = useSearchFilterStore();
  const selectedSources = searchFilterStore.selectedSources;

  const activeSelectedSources = React.useMemo(() => {
    const sources = selectedSources || [];
    if (!searchableSources.length) return [];
    return sources.filter((id: string) => searchableSources.some(s => s.id === id));
  }, [selectedSources, searchableSources]);

  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    if (searchableSources.length > 0 && !isInitialized) {
      setTimeout(() => {
        if (mounted) {
          if (searchFilterStore.selectedSources === null) {
            searchFilterStore.setSelectedSources(searchableSources.map(s => s.id));
          }
          setIsInitialized(true);
        }
      }, 0);
    }
    return () => { mounted = false; };
  }, [searchableSources, isInitialized, searchFilterStore]);

  const toggleSource = (id: string) => {
    searchFilterStore.toggleSource(id);
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
        enabled: activeSelectedSources.length > 0 && !isExhausted,
        placeholderData: keepPreviousData,
      };
    })
  });

  const resultsBySource = React.useMemo(() => {
    const acc: Record<string, { results: any[]; hasNextPage?: boolean; error?: string }> = {};
    activeSelectedSources.forEach((sourceId: string, idx: number) => {
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
  }, [activeSelectedSources, searchQueries, queryClient, dynamicFilters, activeFilters, page, query, isNsfwFiltered]);

  const getMergedMangas = (sourceArrays: { sourceId: string, items: any[] }[]) => {
    const result: { manga: any, sourceId: string }[] = [];
    const seenTitles = new Set<string>();

    let maxLen = 0;
    sourceArrays.forEach(arr => {
      if (arr.items.length > maxLen) maxLen = arr.items.length;
    });

    for (let i = 0; i < maxLen; i++) {
      for (const arr of sourceArrays) {
        if (arr.items[i]) {
          const titleLower = arr.items[i].title.toLowerCase().trim();
          if (!seenTitles.has(titleLower)) {
            seenTitles.add(titleLower);
            result.push({ manga: arr.items[i], sourceId: arr.sourceId });
          }
        }
      }
    }
    return result;
  };

  const searchMangas = resultsBySource ? getMergedMangas(
    Object.entries(resultsBySource).map(([sourceId, res]) => ({
      sourceId,
      items: res.results || []
    }))
  ) : [];

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
