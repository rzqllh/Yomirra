"use client";

import * as React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MagnifyingGlass, WarningCircle, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { useSearchParams } from "next/navigation";
import { MangaCard } from "@/components/manga/manga-card";
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
    <DirectionalTransition>
      <React.Suspense fallback={
        <main className="min-h-screen bg-surface-base">
          <YomirraPageHeader title="" showBack variant="transparent" />
          <div className="px-4 py-6">
            <SearchResultSkeleton />
          </div>
        </main>
      }>
        <SearchContent />
      </React.Suspense>
    </DirectionalTransition>
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

  const isGodMode = useSettingsStore(state => state.isGodMode);

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
      if (src.isNsfw && !isGodMode) return false;
      return true;
    });
  }, [sourcesData, localSources, isGodMode]);
  
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
  const status = searchFilterStore.status;
  const sort = searchFilterStore.sort;

  const filters: Record<string, string | string[]> = {};
  if (genres.length > 0) filters["genre[]"] = genres;
  if (status) filters["status"] = status;
  if (sort) filters["sort"] = sort;

  const { data: searchResponse, isLoading, error } = useQuery({
    queryKey: ["searchGlobal", query, activeSelectedSources, isNsfwFiltered, filters, page],
    queryFn: () => apiClient.searchGlobal(query, activeSelectedSources, page, isNsfwFiltered, filters),
    enabled: query.length > 0 && activeSelectedSources.length > 0,
  });

  const latestQueries = useQueries({
    queries: activeSelectedSources.map(sourceId => ({
      queryKey: ["latest", sourceId, page],
      queryFn: () => apiClient.getLatest(sourceId, page),
      enabled: query.length === 0 && activeSelectedSources.length > 0,
    }))
  });

  const isLatestLoading = latestQueries.some(q => q.isLoading);


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

  const searchMangas = query.length > 0 && searchResponse?.resultsBySource ? getMergedMangas(
    Object.entries(searchResponse.resultsBySource).map(([sourceId, res]) => ({
      sourceId,
      items: res.results || []
    }))
  ) : query.length === 0 ? getMergedMangas(
    latestQueries.map((q, idx) => ({
      sourceId: activeSelectedSources[idx],
      items: q.data?.mangas || []
    }))
  ) : [];

  const hasNextPage = query.length > 0 
    ? Object.values(searchResponse?.resultsBySource || {}).some((res: any) => res.hasNextPage)
    : latestQueries.some(q => q.data?.hasNextPage);

  const searchErrors = query.length > 0 && searchResponse?.resultsBySource
    ? Object.entries(searchResponse.resultsBySource).map(([sourceId, res]) => res.error ? { sourceId, error: res.error } : null).filter(Boolean) as { sourceId: string, error: string }[]
    : query.length === 0 
      ? latestQueries.map((q, idx) => q.isError ? { sourceId: activeSelectedSources[idx], error: q.error?.message || "Gagal memuat" } : null).filter(Boolean) as { sourceId: string, error: string }[]
      : [];

  const errorsToDisplay = searchErrors;

  return (
    <main className="min-h-screen bg-surface-base">
      <YomirraPageHeader title="" showBack variant="transparent" />
      
      <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <DesktopPageTitle 
            title={query ? `Pencarian: ${query}` : "Pencarian"} 
            description="Pilih sumber untuk mencari manga favoritmu."
            icon={<MagnifyingGlass size={32} weight="duotone" />}
          />
        </div>

        <div className="mb-6 flex gap-2">
          <SearchInput 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onSubmitAction={handleSearch}
            placeholder="Cari komik favoritmu..."
            containerClassName="flex-1 h-[44px]"
            onClear={() => setLocalQuery("")}
            autoFocus
          />
          <SearchFilterDrawer />
        </div>

        {/* Source Filter Chips */}
        <div className="mb-6 flex overflow-x-auto [scrollbar-width:none] snap-x px-4 -mx-4 pb-2 gap-3">
          <AnimatePresence>
            {searchableSources.map(source => {
              const isSelected = selectedSources.includes(source.id);
              return (
                <motion.button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all outline-none border ${ isSelected ? "border-accent bg-accent/10 text-accent" : "border-border-subtle bg-surface-raised text-text-secondary hover:border-border-strong hover:text-text-primary shadow-sm"}`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isSelected && <CheckCircle weight="fill" size={16} />}
                    {source.name}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Source Errors */}
        {errorsToDisplay.length > 0 && (
          <div className="mb-8 flex flex-col gap-2">
            {errorsToDisplay.map(err => {
              const source = searchableSources.find(s => s.id === err.sourceId);
              return (
                <div key={err.sourceId} className="flex items-start gap-3 p-3 rounded-xl bg-semantic-error/10 border border-semantic-error/20">
                  <WarningCircle size={20} className="text-semantic-error shrink-0 mt-0.5" weight="fill" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-semantic-error">{source?.name || err.sourceId}</span>
                    <span className="text-sm text-text-secondary line-clamp-2">{err.error}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content States */}
        <AnimatePresence mode="wait">
          {activeSelectedSources.length === 0 ? (
            <motion.div key="no-source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-10">
              <EmptyState 
                icon={<WarningCircle size={40} className="text-accent" weight="duotone" />}
                title="Tidak ada sumber aktif yang dipilih."
                description="Pilih setidaknya satu sumber di atas untuk mencari."
              />
            </motion.div>
          ) : query.length === 0 && isLatestLoading ? (
            <motion.div key="latest-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <SearchResultSkeleton />
            </motion.div>
          ) : isLoading ? (
            <motion.div key="search-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <SearchResultSkeleton />
            </motion.div>
          ) : error && searchMangas.length === 0 ? (
            <motion.div key="search-error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-10">
              <EmptyState 
                icon={<WarningCircle size={40} className="text-semantic-error" weight="duotone" />}
                title="Terjadi kesalahan pencarian."
                description="Silakan coba lagi beberapa saat."
              />
            </motion.div>
          ) : searchMangas.length > 0 ? (
            <motion.div key="search-results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                {query.length === 0 ? "Update Terbaru" : "Hasil Pencarian"}
                <span className="text-sm text-text-muted font-normal ml-2">
                  ({searchMangas.length} judul)
                </span>
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5">
                {searchMangas.map((item) => (
                  <MangaCard 
                    key={`${item.sourceId}-${item.manga.id}`}
                    sourceId={item.sourceId}
                    manga={item.manga}
                    showSourceBadge={true}
                    priority={false}
                  />
                ))}
              </div>

              {/* Advanced Pagination */}
              <div className="mt-12 py-4">
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
            <motion.div key="search-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-10">
              <EmptyState 
                icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
                title="Tidak ada hasil ditemukan."
                description="Coba gunakan kata kunci lain."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
