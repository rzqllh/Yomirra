"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useQuery,
  useQueries,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useSearchPruning } from "@/shared/hooks/use-search-pruning";
import { useSearchReset } from "@/shared/hooks/use-search-reset";
import {
  mergeFilters,
  buildPayloadForSource,
} from "@/shared/utils/filter-helpers";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";
import { clusterCanonicalResults } from "@/shared/lib/canonical-search";
import {
  applySearchTagsToFilters,
  buildHardFilterTags,
  isSourceCompatibleWithTags,
  parseSearchExpression,
  rankHybridScore,
  type SearchCatalogCandidate,
} from "@/shared/lib/search-intelligence";
import type { FilterList, SourceMetadata } from "@/shared/sources/source-types";

export function useSearchCatalog() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const [localQuery, setLocalQuery] = React.useState(query);
  const [page, setPage] = React.useState(1);
  const router = useRouter();
  const searchParamsString = searchParams?.toString() || "";
  const previousQuery = React.useRef(query);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingSearch = React.useCallback(() => {
    if (searchTimeout.current !== null) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = null;
    }
  }, []);

  const navigateToQuery = React.useCallback((value: string) => {
    const nextQuery = value.trim();
    if (nextQuery === query) return;
    const params = new URLSearchParams(searchParamsString);
    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");
    setPage(1);
    const suffix = params.toString();
    router.push(suffix ? `/search?${suffix}` : "/search");
  }, [query, router, searchParamsString]);

  React.useEffect(() => {
    cancelPendingSearch();
    // URL navigation (including Back/Forward) wins over a pending input edit.
    // Never submit a stale debounced value when the committed URL changes.
    if (previousQuery.current !== query) {
      previousQuery.current = query;
      setLocalQuery(query);
      return;
    }
    if (localQuery.trim() === query) return;
    searchTimeout.current = setTimeout(() => navigateToQuery(localQuery), 800);
    return cancelPendingSearch;
  }, [localQuery, query, navigateToQuery, cancelPendingSearch]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    cancelPendingSearch();
    navigateToQuery(localQuery);
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

  const { data: sourcesData } = useQuery(sourceQueryOptions);

  const hideNsfw = useSettingsStore((state) => state.hideNsfw);

  const searchableSources = React.useMemo(() => {
    const sources = [...(sourcesData || [])];
    localSources.forEach((localSource) => {
      if (!sources.find((source) => source.id === localSource.id)) {
        sources.push(localSource);
      }
    });

    return sources.filter((source) => {
      if (!source.isInstalled || source.isEnabled === false || !source.capabilities?.search) {
        return false;
      }
      if (source.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [sourcesData, localSources, hideNsfw]);

  const searchFilterStore = useSearchFilterStore();
  const selectedSources = searchFilterStore.selectedSources;
  const hasCustomizedSources = searchFilterStore.hasCustomizedSources;

  const activeSelectedSources = React.useMemo(() => {
    if (!searchableSources.length) return [];
    if (!hasCustomizedSources || selectedSources === null) {
      return searchableSources.map((source) => source.id);
    }
    const filtered = selectedSources.filter((id) =>
      searchableSources.some((source) => source.id === id)
    );
    return filtered.length > 0 ? filtered : searchableSources.map((source) => source.id);
  }, [hasCustomizedSources, selectedSources, searchableSources]);

  const toggleSource = (id: string) => {
    searchFilterStore.toggleSource(
      id,
      searchableSources.map((source) => source.id)
    );
  };

  const genres = searchFilterStore.genres;
  const formats = searchFilterStore.formats;
  const status = searchFilterStore.status;
  const sort = searchFilterStore.sort;

  const filtersQueries = useQueries({
    queries: activeSelectedSources.map((sourceId) => ({
      queryKey: ["sourceFilters", sourceId],
      queryFn: (): Promise<FilterList> => apiClient.getFilters(sourceId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isFiltersLoading = filtersQueries.some(
    (filterQuery) => filterQuery.isLoading || filterQuery.isFetching
  );
  const hasFiltersError = filtersQueries.some((filterQuery) => filterQuery.isError);
  const isCapabilitiesLoaded =
    filtersQueries.filter((filterQuery) => filterQuery.isSuccess).length ===
    activeSelectedSources.length;

  const dynamicFilters = React.useMemo(() => {
    const sourceFilters = activeSelectedSources.flatMap((sourceId, index) => {
      const filters = filtersQueries[index]?.data;
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
    pruneFilters: searchFilterStore.pruneFilters,
  });

  const parsedQuery = React.useMemo(
    () => parseSearchExpression(query, dynamicFilters),
    [query, dynamicFilters]
  );

  const activeFilters = React.useMemo(
    () =>
      applySearchTagsToFilters(
        { genres, formats, status, sort },
        parsedQuery.tags
      ),
    [genres, formats, status, sort, parsedQuery.tags]
  );

  const hardFilterTags = React.useMemo(
    () => buildHardFilterTags(activeFilters, dynamicFilters),
    [activeFilters, dynamicFilters]
  );

  const hasDrawerFilters =
    genres.length > 0 ||
    formats.length > 0 ||
    Boolean(status) ||
    (Boolean(sort) && sort !== "popular");
  const hasSearchIntent =
    Boolean(parsedQuery.textQuery.trim()) ||
    parsedQuery.tags.length > 0 ||
    hasDrawerFilters;

  useSearchReset({
    activeSelectedSources,
    genres,
    formats,
    status,
    sort,
    query,
    setPage,
  });

  const eligibleSourceIds = React.useMemo(
    () =>
      activeSelectedSources.filter((sourceId) => {
        const source = searchableSources.find((item) => item.id === sourceId);
        const unavailable =
          source?.status === "unavailable" || source?.status === "in-fix";
        return (
          !unavailable &&
          isSourceCompatibleWithTags(
            sourceId,
            hardFilterTags,
            dynamicFilters
          )
        );
      }),
    [activeSelectedSources, searchableSources, hardFilterTags, dynamicFilters]
  );

  const queryClient = useQueryClient();

  const searchQueries = useQueries({
    queries: activeSelectedSources.map((sourceId) => {
      const source = searchableSources.find((item) => item.id === sourceId);
      const isUnreachable =
        source?.status === "unavailable" || source?.status === "in-fix";
      const isTagCompatible = isSourceCompatibleWithTags(
        sourceId,
        hardFilterTags,
        dynamicFilters
      );
      const payload = buildPayloadForSource(
        sourceId,
        dynamicFilters,
        activeFilters
      );

      let isExhausted = false;
      for (let previousPage = 1; previousPage < page; previousPage++) {
        const previous = queryClient.getQueryData<{ hasNextPage?: boolean }>([
          "searchSource",
          sourceId,
          parsedQuery.textQuery,
          hideNsfw,
          payload,
          previousPage,
        ]);
        if (previous?.hasNextPage === false) {
          isExhausted = true;
          break;
        }
      }

      return {
        queryKey: [
          "searchSource",
          sourceId,
          parsedQuery.textQuery,
          hideNsfw,
          payload,
          page,
        ],
        queryFn: ({ signal }: { signal?: AbortSignal }) =>
          apiClient.search(
            sourceId,
            parsedQuery.textQuery,
            page,
            payload,
            hideNsfw,
            { signal }
          ),
        enabled:
          hasSearchIntent &&
          !isExhausted &&
          !isUnreachable &&
          isTagCompatible,
        placeholderData: keepPreviousData,
      };
    }),
  });

  const resultsBySource = React.useMemo(() => {
    const results: Record<
      string,
      { results: any[]; hasNextPage?: boolean; error?: string }
    > = {};

    if (!hasSearchIntent) return results;

    activeSelectedSources.forEach((sourceId, index) => {
      const source = searchableSources.find((item) => item.id === sourceId);
      const isUnreachable =
        source?.status === "unavailable" || source?.status === "in-fix";
      const isTagCompatible = isSourceCompatibleWithTags(
        sourceId,
        hardFilterTags,
        dynamicFilters
      );

      if (!isTagCompatible) {
        results[sourceId] = { results: [], hasNextPage: false };
        return;
      }

      if (isUnreachable) {
        results[sourceId] = {
          error: `Sumber sedang mengalami gangguan (${
            source?.status === "in-fix" ? "dalam perbaikan" : "tidak tersedia"
          })`,
          results: [],
        };
        return;
      }

      const searchQuery = searchQueries[index];
      if (searchQuery?.data) {
        results[sourceId] = {
          results: searchQuery.data.results || [],
          hasNextPage: searchQuery.data.hasNextPage,
        };
      } else if (searchQuery?.error) {
        results[sourceId] = {
          error: (searchQuery.error as Error).message || "Error",
          results: [],
        };
      }
    });

    return results;
  }, [
    hasSearchIntent,
    activeSelectedSources,
    searchableSources,
    hardFilterTags,
    dynamicFilters,
    searchQueries,
  ]);

  const rawSearchMangas = React.useMemo(() => {
    const flattened: Array<{ manga: any; sourceId: string }> = [];
    const sourceArrays = Object.entries(resultsBySource).map(
      ([sourceId, result]) => ({
        sourceId,
        items: result.results || [],
      })
    );

    let maxLength = 0;
    sourceArrays.forEach((source) => {
      maxLength = Math.max(maxLength, source.items.length);
    });

    for (let index = 0; index < maxLength; index++) {
      for (const source of sourceArrays) {
        if (source.items[index]) {
          flattened.push({
            manga: source.items[index],
            sourceId: source.sourceId,
          });
        }
      }
    }

    return clusterCanonicalResults(flattened).map((cluster) => ({
      canonicalKey: cluster.canonicalKey,
      manga: cluster.primaryResult,
      sourceId: cluster.primaryResult.sourceId,
      sourceBindings: cluster.sourceBindings,
    }));
  }, [resultsBySource]);

  const intelligenceCandidates = React.useMemo<SearchCatalogCandidate[]>(
    () =>
      rawSearchMangas.map((item) => ({
        canonicalKey: item.canonicalKey,
        sourceId: item.sourceId,
        mangaId: item.manga.id,
        title: item.manga.title,
        coverUrl: item.manga.coverUrl,
        originalTitle: item.manga.originalTitle,
        alternativeTitles: item.manga.alternativeTitles,
        author: item.manga.author,
        description: item.manga.description,
        format: item.manga.format,
        status: item.manga.status,
        score: item.manga.score,
        sourceBindings: item.sourceBindings,
      })),
    [rawSearchMangas]
  );

  const sourceSearchSettled = searchQueries.every(
    (sourceQuery) => sourceQuery.fetchStatus !== "fetching"
  );
  const candidateSignature = intelligenceCandidates
    .map((candidate) => candidate.canonicalKey)
    .join("|");
  const tagSignature = hardFilterTags
    .map((tag) => `${tag.category}:${tag.id}`)
    .join("|");

  const intelligenceQuery = useQuery({
    queryKey: [
      "searchIntelligence",
      parsedQuery.textQuery,
      tagSignature,
      candidateSignature,
    ],
    queryFn: () =>
      apiClient.rankSearchIntelligence(
        parsedQuery.textQuery,
        hardFilterTags,
        intelligenceCandidates
      ),
    enabled:
      hasSearchIntent &&
      sourceSearchSettled &&
      (Boolean(parsedQuery.textQuery) || hardFilterTags.length > 0),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const catalogMatches = React.useMemo(() => {
    const matches = intelligenceQuery.data?.catalogMatches ?? [];

    return matches.flatMap((candidate) => {
      const availableBindings = (candidate.sourceBindings ?? []).filter(
        (binding) => eligibleSourceIds.includes(binding.sourceId)
      );
      const fallbackBinding = eligibleSourceIds.includes(candidate.sourceId)
        ? {
            sourceId: candidate.sourceId,
            mangaId: candidate.mangaId,
            title: candidate.title,
            coverUrl: candidate.coverUrl,
          }
        : undefined;
      const primaryBinding = availableBindings[0] ?? fallbackBinding;
      if (!primaryBinding) return [];

      return [
        {
          canonicalKey: candidate.canonicalKey,
          sourceId: primaryBinding.sourceId,
          sourceBindings:
            availableBindings.length > 0
              ? availableBindings
              : [primaryBinding],
          manga: {
            id: primaryBinding.mangaId,
            title: candidate.title,
            coverUrl: candidate.coverUrl || primaryBinding.coverUrl || "",
            originalTitle: candidate.originalTitle,
            alternativeTitles: candidate.alternativeTitles,
            author: candidate.author,
            description: candidate.description,
            format: candidate.format,
            status: candidate.status,
            score: candidate.score,
            sourceId: primaryBinding.sourceId,
            sourceBindings:
              availableBindings.length > 0
                ? availableBindings
                : [primaryBinding],
          },
        },
      ];
    });
  }, [intelligenceQuery.data?.catalogMatches, eligibleSourceIds]);

  const combinedResults = React.useMemo(() => {
    const merged = new Map(
      rawSearchMangas.map((item) => [item.canonicalKey, item])
    );
    catalogMatches.forEach((item) => {
      if (!merged.has(item.canonicalKey)) merged.set(item.canonicalKey, item);
    });
    return Array.from(merged.values());
  }, [rawSearchMangas, catalogMatches]);

  const searchMangas = React.useMemo(() => {
    const results = [...combinedResults];

    if (sort === "rating") {
      return results.sort((a, b) => {
        const scoreA =
          typeof a.manga.score === "number" && a.manga.score > 0
            ? a.manga.score
            : -1;
        const scoreB =
          typeof b.manga.score === "number" && b.manga.score > 0
            ? b.manga.score
            : -1;
        if (scoreA === -1 && scoreB === -1) return 0;
        if (scoreA === -1) return 1;
        if (scoreB === -1) return -1;
        return scoreB - scoreA;
      });
    }

    if (!parsedQuery.textQuery) return results;

    const semanticScores = intelligenceQuery.data?.scores ?? {};
    return results.sort((a, b) => {
      const candidateA: SearchCatalogCandidate = {
        canonicalKey: a.canonicalKey,
        sourceId: a.sourceId,
        mangaId: a.manga.id,
        title: a.manga.title,
        originalTitle: a.manga.originalTitle,
        alternativeTitles: a.manga.alternativeTitles,
        author: a.manga.author,
      };
      const candidateB: SearchCatalogCandidate = {
        canonicalKey: b.canonicalKey,
        sourceId: b.sourceId,
        mangaId: b.manga.id,
        title: b.manga.title,
        originalTitle: b.manga.originalTitle,
        alternativeTitles: b.manga.alternativeTitles,
        author: b.manga.author,
      };
      return (
        rankHybridScore(
          parsedQuery.textQuery,
          candidateB,
          semanticScores[b.canonicalKey]
        ) -
        rankHybridScore(
          parsedQuery.textQuery,
          candidateA,
          semanticScores[a.canonicalKey]
        )
      );
    });
  }, [
    combinedResults,
    sort,
    parsedQuery.textQuery,
    intelligenceQuery.data?.scores,
  ]);

  const hasNextPage = Object.values(resultsBySource).some(
    (result) => result.hasNextPage
  );

  const errorsToDisplay = Object.entries(resultsBySource)
    .filter(([sourceId]) => eligibleSourceIds.includes(sourceId))
    .map(([sourceId, result]) =>
      result.error ? { sourceId, error: result.error } : null
    )
    .filter(Boolean) as { sourceId: string; error: string }[];

  const isInitialLoading =
    hasSearchIntent &&
    searchQueries.some(
      (sourceQuery) =>
        sourceQuery.fetchStatus === "fetching" && !sourceQuery.data
    );
  const allSourcesFailed =
    eligibleSourceIds.length > 0 &&
    errorsToDisplay.length === eligibleSourceIds.length;
  const hasActiveFilters =
    hasDrawerFilters || parsedQuery.tags.length > 0;

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
    hasSearchIntent,
    handleSearchSubmit,
    queryClient,
    dynamicFilters,
    parsedQuery,
    semanticAvailable: Boolean(intelligenceQuery.data?.semanticAvailable),
  };
}
