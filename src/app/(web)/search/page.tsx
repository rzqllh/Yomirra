"use client";

import * as React from "react";
import { useQuery, useQueries, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MagnifyingGlass, WarningCircle, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { PageHeader } from "@/components/app/header";
import { useSearchParams } from "next/navigation";
import { ShelfCard } from "@/components/manga/card";
import { motion, AnimatePresence } from "motion/react";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { EmptyState } from "@/components/states/empty-state";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";

import { SearchInput } from "@/components/ui/search-input";
import { SearchFilterDrawer } from "@/components/search/search-filter-drawer";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useSearchPruning } from "@/shared/hooks/use-search-pruning";
import { useSearchReset } from "@/shared/hooks/use-search-reset";
import { mergeFilters, buildPayloadForSource } from "@/shared/utils/filter-helpers";
import type { FilterList } from "@/shared/sources/source-types";
import { cn } from "@/shared/utils/cn";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationNext10,
  PaginationPrevious10,
  PaginationEllipsis
} from "@/components/ui/pagination";

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <main className="min-h-screen bg-surface-base">
        <PageHeader title="Pencarian" description="Temukan komik dari berbagai sumber" icon={<MagnifyingGlass size={32} weight="duotone" />} />
        <div className="px-4 py-6">
          <SearchResultSkeleton />
        </div>
      </main>
    }>
      <SearchContent />
    </React.Suspense>
  );
}

import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const [localQuery, setLocalQuery] = React.useState(query);
  const [page, setPage] = React.useState(1);
  const router = useRouter();

  const debouncedQuery = useDebounce(localQuery, 800);

  React.useEffect(() => {
    if (debouncedQuery !== query) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (debouncedQuery.trim() === "") {
        params.delete("q");
      } else {
        params.set("q", debouncedQuery.trim());
      }
      setPage(1); // Reset page on new query
      router.push(`/search?${params.toString()}`);
    }
  }, [debouncedQuery, query, router, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() !== query) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("q", localQuery.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  const [localSources, setLocalSources] = React.useState<import("@/shared/sources/source-types").SourceMetadata[]>([]);

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
    // Search page bypasses the rule, but still respects God Mode for NSFW sources
    return s.filter(src => {
      if (!src.isInstalled || !src.capabilities?.search) return false;
      if (src.status !== "online") return false; // Hide sources that are in-fix or in-dev
      if (src.isNsfw && hideNsfw) return false;
      return true;
    });
  }, [sourcesData, localSources, hideNsfw]);
  
  const searchFilterStore = useSearchFilterStore();
  const selectedSources = searchFilterStore.selectedSources || [];
  
  const activeSelectedSources = React.useMemo(() => {
    if (!searchableSources.length) return [];
    return selectedSources.filter(id => searchableSources.some(s => s.id === id));
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

  // Fetch capability filters per source
  const filtersQueries = useQueries({
    queries: activeSelectedSources.map(sourceId => ({
      queryKey: ["sourceFilters", sourceId],
      queryFn: (): Promise<FilterList> => apiClient.getFilters(sourceId),
      staleTime: 5 * 60 * 1000,
    }))
  });

  const isFiltersLoading = filtersQueries.some(q => q.isLoading || q.isFetching);
  const hasFiltersError = filtersQueries.some(q => q.isError);
  const isCapabilitiesLoaded = filtersQueries.filter(q => q.isSuccess).length === activeSelectedSources.length;

  const dynamicFilters = React.useMemo(() => {
    const sourceFilters = activeSelectedSources.flatMap((sourceId, idx) => {
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

  // Execute parallel search requests per source with source-specific filter payload
  const searchQueries = useQueries({
    queries: activeSelectedSources.map((sourceId) => {
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
        queryFn: ({ signal }) => apiClient.search(sourceId, query, page, payload, isNsfwFiltered, { signal }),
        enabled: activeSelectedSources.length > 0 && !isExhausted,
        placeholderData: keepPreviousData,
      };
    })
  });

  const isLoading = searchQueries.some(q => q.isLoading);
  const searchError = searchQueries.find(q => q.error)?.error || null;

  const resultsBySource = React.useMemo(() => {
    const acc: Record<string, { results?: any[]; hasNextPage?: boolean; error?: string }> = {};
    activeSelectedSources.forEach((sourceId, idx) => {
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

  // Helper to interleave and deduplicate mangas from multiple sources
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

  return (
    <main className="min-h-screen bg-surface-base pb-[calc(var(--bottom-nav-height,80px)+24px)]">
      <div className="px-4 max-w-7xl mx-auto space-y-5">
        {/* Document Flow Header */}
        <div className="pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8">
          <PageHeader
            title="Pencarian"
            description="Temukan komik dari berbagai sumber"
            icon={<MagnifyingGlass size={32} weight="duotone" />}
          />
        </div>

        {/* Search & Filter Row */}
        <div className="flex gap-2 items-center">
          <SearchInput 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onSubmitAction={handleSearch}
            placeholder="Cari komik..."
            containerClassName="flex-1 h-[44px]"
            onClear={() => setLocalQuery("")}
            autoFocus
          />
          <SearchFilterDrawer />
        </div>

        {/* Source Control Rail */}
        <div className="flex overflow-x-auto [scrollbar-width:none] snap-x px-4 -mx-4 pb-1 gap-2.5">
          {searchableSources.map(source => {
            const isSelected = activeSelectedSources.includes(source.id);
            const isOffline = source.status === "unavailable" || source.status === "in-fix";
            return (
              <button
                key={source.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Sumber ${source.name}`}
                onClick={() => toggleSource(source.id)}
                className={cn(
                  "relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all outline-none border min-h-[44px]",
                  isSelected
                    ? "border-accent bg-accent/10 text-accent shadow-xs"
                    : "border-border-subtle bg-surface-raised/40 text-text-secondary hover:border-border-strong hover:text-text-primary"
                )}
              >
                {isSelected && <CheckCircle weight="fill" size={15} className="shrink-0" />}
                <span>{source.name}</span>
                {isOffline && (
                  <span className="text-[10px] font-semibold text-semantic-warning bg-semantic-warning/15 px-1.5 py-0.5 rounded-full border border-semantic-warning/30 shrink-0">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Partial Failure Warning (Compact) */}
        {errorsToDisplay.length > 0 && !allSourcesFailed && (
          <div className="flex flex-col gap-2">
            {errorsToDisplay.map(err => {
              const source = searchableSources.find(s => s.id === err.sourceId);
              return (
                <div key={err.sourceId} className="flex items-center justify-between p-3 rounded-xl bg-semantic-error/10 border border-semantic-error/20 text-xs font-semibold text-semantic-error">
                  <div className="flex items-center gap-2 min-w-0">
                    <WarningCircle size={16} weight="fill" className="shrink-0" />
                    <span className="truncate">{source?.name || err.sourceId} gagal dimuat</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeSelectedSources.length === 0 ? (
            <motion.div key="no-source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-8">
              <EmptyState 
                icon={<WarningCircle size={40} className="text-accent" weight="duotone" />}
                title="Tidak ada sumber aktif yang dipilih"
                description="Pilih setidaknya satu sumber di atas untuk mulai mencari."
              />
            </motion.div>
          ) : isInitialLoading && searchMangas.length === 0 ? (
            <motion.div key="loading-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SearchResultSkeleton />
            </motion.div>
          ) : allSourcesFailed && searchMangas.length === 0 ? (
            <motion.div key="global-error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-8">
              <EmptyState 
                icon={<WarningCircle size={40} className="text-semantic-error" weight="duotone" />}
                title={
                  activeSelectedSources.length === 1
                    ? `${searchableSources.find(s => s.id === activeSelectedSources[0])?.name || activeSelectedSources[0]} tidak dapat dimuat`
                    : "Terjadi kesalahan pencarian"
                }
                description={
                  activeSelectedSources.length === 1
                    ? "Gagal terhubung ke sumber ini. Silakan coba lagi beberapa saat."
                    : "Semua sumber terpilih tidak dapat diakses saat ini."
                }
                action={
                  <button
                    onClick={() => {
                      if (activeSelectedSources.length === 1) {
                        queryClient.invalidateQueries({ queryKey: ["searchSource", activeSelectedSources[0]] });
                      } else {
                        queryClient.invalidateQueries({ queryKey: ["searchSource"] });
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent-hover transition-colors"
                  >
                    Coba Lagi
                  </button>
                }
              />
            </motion.div>
          ) : searchMangas.length > 0 ? (
            <motion.div key="results-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-bold flex items-center gap-2 text-text-primary tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  {query.length === 0 ? "Update Terbaru" : "Hasil Pencarian"}
                </h2>
                <span className="text-xs font-semibold text-text-muted">
                  {searchMangas.length} {query.length === 0 ? "judul" : "hasil"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10 lg:grid-cols-5 xl:grid-cols-6">
                {searchMangas.map((item) => (
                  <ShelfCard 
                    key={`${item.sourceId}-${item.manga.id}`}
                    sourceId={item.sourceId}
                    manga={item.manga}
                    showSourceBadge={true}
                    priority={false}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 py-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious10
                        onClick={() => setPage(p => Math.max(1, p - 10))}
                        className={cn(page <= 10 && "opacity-50 pointer-events-none")}
                        aria-disabled={page <= 10}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={cn(page === 1 && "opacity-50 pointer-events-none")}
                        aria-disabled={page === 1}
                      />
                    </PaginationItem>
                    
                    {page > 2 && (
                      <>
                        <PaginationItem>
                          <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      </>
                    )}
                    
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page - 1)}>{page - 1}</PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationLink isActive>{page}</PaginationLink>
                    </PaginationItem>

                    {hasNextPage && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page + 1)}>{page + 1}</PaginationLink>
                      </PaginationItem>
                    )}

                    {hasNextPage && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => p + 1)}
                        className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                        aria-disabled={!hasNextPage}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext10
                        onClick={() => setPage(p => p + 10)}
                        className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                        aria-disabled={!hasNextPage}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </motion.div>
          ) : (
            <motion.div key="search-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-8">
              <EmptyState 
                icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
                title={hasActiveFilters ? "Tidak ada komik yang cocok dengan filter" : query.length > 0 ? "Tidak ada komik yang ditemukan" : "Tidak ada komik ditemukan"}
                description={hasActiveFilters ? "Coba sesuaikan atau reset filter pencarian." : query.length > 0 ? "Coba gunakan kata kunci lain." : "Pilih sumber lain untuk menampilkan komik."}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
