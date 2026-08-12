"use client";

import * as React from "react";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ShelfCard, HistoryCard } from "@/components/manga/card";
import { SearchInput } from "@/components/ui/search-input";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
import { 
  MagnifyingGlass, 
  CheckCircle, 
  CircleNotch, 
  SmileySad, 
  X, 
  Funnel, 
  Books, 
  Clock, 
  SquaresFour, 
  List 
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
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

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { MangaKey } from "@/shared/types/collection";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { YomirraSurface } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
import { LibraryFilterDrawer } from "@/components/library/library-filter-drawer";
import { CustomSelect } from "@/components/ui/custom-select";

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

function LibraryContent() {
  const isMounted = useMounted();
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get("source");
  const genreParams = searchParams.getAll("genre").map(g => g.toLowerCase().replace(/\s+/g, '-'));
  const activeSourceId = sourceParam || "shinigami";
  
  const sortParam = searchParams.get("sort");
  
  const filterStore = useLibraryFilterStore();
  const { selectedGenres, excludedGenres, selectedFormats, selectedStatuses, selectedCollections, selectedReadingStatuses, sort: storeSort, query: storeQuery, viewMode } = filterStore;
  
  const libraryItems = useLibraryStore(state => state.items);
  const { collections, membershipsByManga, readingStatusByManga } = useCollectionStore();
  
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(deferredSearchInput.trim());
      filterStore.setFilters({ query: deferredSearchInput.trim() });
      setPage(1);
    }
  }, [deferredSearchInput, query]);

  const { data: filtersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isNsfwFiltered = useSettingsStore(state => state.hideNsfw);

  const GENRES = React.useMemo(() => {
    const apiGenres = filtersData?.genres || [];
    const combined = [...apiGenres];
    selectedGenres.forEach(id => {
      if (!combined.find(g => g.id === id)) {
        combined.push({ id, name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) });
      }
    });
    excludedGenres.forEach(id => {
      if (!combined.find(g => g.id === id)) {
        combined.push({ id, name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) });
      }
    });
    return combined;
  }, [filtersData?.genres, selectedGenres, excludedGenres]);

  const DYNAMIC_FORMATS = filtersData?.formats || FORMATS;
  const DYNAMIC_STATUSES = filtersData?.statuses || STATUSES;
  const DYNAMIC_SORTS = filtersData?.sorts || [
    { id: "popular", name: "🔥 Populer" },
    { id: "latest", name: "✨ Terbaru" },
  ];

  const router = useRouter();
  const pathname = usePathname();

  // Fallback to supported sort if current sort is not available in the new source
  React.useEffect(() => {
    if (filtersData?.sorts) {
      const isSupported = filtersData.sorts.some(s => s.id === sort);
      if (!isSupported && filtersData.sorts.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSort(filtersData.sorts[0].id);
      }
    }
  }, [filtersData?.sorts, sort]);

  // Sync local sort state with storeSort (when changed by drawer)
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
    const hasLocalFilters = selectedCollections.length > 0 || selectedReadingStatuses.length > 0;
    
    if (hasLocalFilters) {
      const localMangas = Object.values(libraryItems).filter(item => {
        if (item.sourceId !== activeSourceId) return false;
        
        const key = `${item.sourceId}::${item.mangaId}` as MangaKey;
        
        let passCollection = true;
        if (selectedCollections.length > 0) {
           const memberships = membershipsByManga[key] || [];
           passCollection = selectedCollections.some(c => memberships.includes(c));
        }

        let passStatus = true;
        if (selectedReadingStatuses.length > 0) {
           const status = readingStatusByManga[key];
           passStatus = status ? selectedReadingStatuses.includes(status) : false;
        }
        
        let passSearch = true;
        if (query) {
           passSearch = item.title.toLowerCase().includes(query.toLowerCase());
        }

        return passCollection && passStatus && passSearch;
      });

      // Sort local results (newest/popular logic simplified for local)
      if (sort === "latest") {
        localMangas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } else if (sort === "alphabetical") {
        localMangas.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // default "popular" or anything else: sort by date added
        localMangas.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      }

      const PAGE_SIZE = 24;
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const paginated = localMangas.slice(start, end).map(item => ({
         id: item.mangaId,
         title: item.title,
         coverUrl: item.coverUrl || "",
         author: item.author,
         status: item.status,
         format: item.format,
      }));

      return { mangas: paginated as any[], hasNextPage: end < localMangas.length };
    }

    const hasFilters = selectedGenres.length > 0 || excludedGenres.length > 0 || selectedFormats.length > 0 || selectedStatuses.length > 0;

    // Use optimized endpoints for simple browsing (no search, no filters)
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
    else filters.sort = sort; // Use specific sort format supported by source
    
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
    refetch
  } = useQuery({
    queryKey: ["library-v2", activeSourceId, query, sort, selectedGenres, excludedGenres, selectedFormats, selectedStatuses, selectedCollections, selectedReadingStatuses, page, isNsfwFiltered],
    queryFn: () => fetchCatalog(page),
    staleTime: 1000 * 60, // 1 minute
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

  const toggleGenre = (id: string) => {
    setPage(1);
    if (selectedGenres.includes(id)) {
      filterStore.setFilters({
        selectedGenres: selectedGenres.filter(g => g !== id),
        excludedGenres: [...excludedGenres, id]
      });
    } else if (excludedGenres.includes(id)) {
      filterStore.setFilters({
        excludedGenres: excludedGenres.filter(g => g !== id)
      });
    } else {
      filterStore.setFilters({
        selectedGenres: [...selectedGenres, id]
      });
    }
  };

  const toggleFilter = (id: string, state: string[], key: "selectedFormats" | "selectedStatuses") => {
    setPage(1);
    if (state.includes(id)) {
      filterStore.setFilters({ [key]: state.filter(i => i !== id) });
    } else {
      filterStore.setFilters({ [key]: [...state, id] });
    }
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
  // Deduplicate mangas array to prevent duplicate view-transition-names
  const mangas = Array.from(new Map(rawMangas.map(m => [m.id, m])).values());

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <LibrarySkeleton />
        </YomirraSurface>
      </div>
    );
  }

  const totalLibraryCount = Object.keys(libraryItems).length;

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Library Yomirra</h1>
      <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 md:py-8">
          
          {/* 1. Header Section */}
          <PageHeader
            title="Library"
            description="Koleksi komik dan riwayat bacaan favoritmu."
            icon={<Books size={32} weight="duotone" />}
            meta={<span className="text-sm font-bold text-text-muted">{totalLibraryCount} judul</span>}
          />

          {/* 2. Search & Filter Row */}
          <div className="flex items-center gap-3 mt-6 md:mt-7">
            <SearchInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSubmitAction={handleSearchSubmit}
              onClear={() => { setSearchInput(""); setQuery(""); setPage(1); }}
              placeholder="Cari di library..."
              containerClassName="flex-1 min-w-0 h-[44px]"
            />

            <LibraryFilterDrawer activeSourceId={activeSourceId}>
              <Button
                variant={activeFilterCount > 0 ? "accent" : "outline"}
                className={cn("shrink-0 h-[44px] px-4 rounded-full font-bold gap-1.5 transition-all duration-300", activeFilterCount === 0 && "bg-surface-glass backdrop-blur-md text-text-primary")}
                aria-label={`Filter ${activeFilterCount > 0 ? `(${activeFilterCount} aktif)` : ''}`}
              >
                <Funnel size={18} weight={activeFilterCount > 0 ? "fill" : "bold"} />
                <span>Filter</span>
                {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
              </Button>
            </LibraryFilterDrawer>
          </div>

          {/* 3. Quick Sort & Reading Status Row */}
          <div className="flex items-center mt-1 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="shrink-0 flex items-center z-50">
              <CustomSelect
                value={sort}
                onChange={(v) => handleTabChange(v)}
                options={DYNAMIC_SORTS.map(s => ({ value: s.id, label: s.name }))}
                align="left"
                className="shrink-0"
                buttonClassName="h-[36px] px-3.5 text-[13px] rounded-full bg-surface-raised border-border-subtle hover:border-border-strong font-semibold shadow-sm"
              />
              <div className="w-px h-5 bg-border-subtle shrink-0 mx-2.5" />
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar flex-1 py-3 -mr-4 pr-4 md:mr-0 md:pr-0">
              {[
              { id: "", label: "Semua" },
              { id: "reading", label: "Sedang Dibaca" },
              { id: "plan-to-read", label: "Akan Dibaca" },
              { id: "completed", label: "Selesai" },
              { id: "on-hold", label: "Ditunda" },
              { id: "dropped", label: "Dihentikan" }
            ].map(status => {
              const isSelected = status.id === ""
                ? selectedReadingStatuses.length === 0
                : selectedReadingStatuses.includes(status.id);

              return (
                <button
                  key={status.id}
                  onClick={() => {
                    setPage(1);
                    if (status.id === "") {
                      filterStore.setFilters({ selectedReadingStatuses: [] });
                    } else {
                      filterStore.setFilters({ selectedReadingStatuses: [status.id] });
                    }
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "shrink-0 h-[36px] px-4 rounded-full text-[13px] font-bold transition-all whitespace-nowrap active:scale-[0.98]",
                    isSelected
                      ? "bg-accent text-white shadow-[0_0_12px_rgba(94,92,230,0.3)] border border-transparent"
                      : "bg-surface-raised text-text-secondary border border-border-subtle hover:border-border-strong"
                  )}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>

          {/* 4. Collections Rail */}
          {collections.length > 0 && (
            <div className="mt-6 mb-2">
              <h3 className="text-xs font-black tracking-widest text-text-muted uppercase mb-3 px-1">
                Koleksi
              </h3>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {(() => {
                  // Calculate counts for active source
                  const sourceItems = Object.values(libraryItems).filter(item => item.sourceId === activeSourceId);
                  const totalSemua = sourceItems.length;

                  const getCollectionCount = (cId: string) => {
                    return sourceItems.filter(item => {
                      const key = `${item.sourceId}::${item.mangaId}` as MangaKey;
                      const memberships = membershipsByManga[key] || [];
                      return memberships.includes(cId);
                    }).length;
                  };

                  return (
                    <>
                      <button
                        onClick={() => {
                          setPage(1);
                          filterStore.setFilters({ selectedCollections: [] });
                        }}
                        aria-pressed={selectedCollections.length === 0}
                        className={cn(
                          "shrink-0 h-[36px] px-4 rounded-full text-[13px] font-bold transition-all whitespace-nowrap active:scale-[0.98] flex items-center gap-2",
                          selectedCollections.length === 0
                            ? "bg-accent text-white shadow-[0_0_12px_rgba(94,92,230,0.3)] border border-transparent"
                            : "bg-surface-raised text-text-secondary border border-border-subtle hover:border-border-strong"
                        )}
                      >
                        Semua
                        <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md", selectedCollections.length === 0 ? "bg-white/20" : "bg-border-subtle/50 text-text-muted")}>
                          {totalSemua}
                        </span>
                      </button>

                      {collections.map(c => {
                        const isSelected = selectedCollections.includes(c.id);
                        const count = getCollectionCount(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setPage(1);
                              filterStore.setFilters({ selectedCollections: [c.id] });
                            }}
                            aria-pressed={isSelected}
                            className={cn(
                              "shrink-0 h-[36px] px-4 rounded-full text-[13px] font-bold transition-all whitespace-nowrap active:scale-[0.98] flex items-center gap-2",
                              isSelected
                                ? "bg-accent text-white shadow-[0_0_12px_rgba(94,92,230,0.3)] border border-transparent"
                                : "bg-surface-raised text-text-secondary border border-border-subtle hover:border-border-strong"
                            )}
                          >
                            {c.name}
                            <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md", isSelected ? "bg-white/20" : "bg-border-subtle/50 text-text-muted")}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {isDisabled ? (
            <EmptyState
              icon={<Funnel size={40} className="text-text-muted" weight="duotone" />}
              title="Sumber Dinonaktifkan"
              description="Kamu telah menonaktifkan sumber ini. Aktifkan kembali di halaman Sumber untuk melihat pustaka."
              action={<Button onClick={() => router.push('/sources')} variant="outline" className="mt-4 rounded-full shadow-sm font-bold">Kelola Sumber</Button>}
            />
          ) : isLoading ? (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:gap-x-5 md:gap-y-10"
                : "flex flex-col gap-3"
            )}>
              {Array.from({ length: 12 }).map((_, i) => (
                <MangaCardSkeleton key={i} variant={viewMode === "grid" ? "shelf" : "history"} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={<SmileySad size={40} className="text-text-muted" weight="duotone" />}
              title="Gagal memuat katalog"
              description="Terjadi kesalahan saat mengambil data dari sumber."
              action={<Button onClick={() => refetch()} variant="outline" className="mt-4 rounded-full shadow-sm font-bold">Coba lagi</Button>}
            />
          ) : mangas.length === 0 ? (
            (() => {
              if (Object.keys(libraryItems).length === 0) {
                return (
                  <EmptyState
                    icon={<Books size={40} className="text-text-muted" weight="duotone" />}
                    title="Library Kosong"
                    description="Belum ada manga yang ditambahkan ke Library."
                  />
                );
              }
              if (selectedCollections.length > 0 && !query && selectedGenres.length === 0 && excludedGenres.length === 0 && selectedFormats.length === 0 && selectedStatuses.length === 0 && selectedReadingStatuses.length === 0) {
                return (
                  <EmptyState
                    icon={<Books size={40} className="text-text-muted" weight="duotone" />}
                    title="Koleksi Kosong"
                    description="Koleksi ini belum memiliki manga."
                  />
                );
              }
              return (
                <EmptyState
                  icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
                  title="Manga tidak ditemukan"
                  description="Coba ubah kombinasi filter atau kata kunci pencarian."
                  action={<Button onClick={resetFilters} variant="outline" className="mt-4 rounded-full shadow-sm font-bold">Reset Filter</Button>}
                />
              );
            })()
          ) : (
            <>
              {/* Opacity transition when fetching next/prev pages */}
              <motion.div layout className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:gap-x-5 md:gap-y-10"
                  : "flex flex-col gap-3",
                "transition-opacity duration-200",
                isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
              )}>
                <AnimatePresence>
                  {mangas.map((manga) => (
                    viewMode === "grid" ? (
                      <ShelfCard key={manga.id} manga={manga} sourceId={activeSourceId} showSourceBadge={true} />
                    ) : (
                      <HistoryCard key={manga.id} manga={manga} sourceId={activeSourceId} />
                    )
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Advanced Pagination */}
              <div className="mt-12 py-4">
                <Pagination>
                  <PaginationContent className="gap-1 sm:gap-2">
                    <PaginationItem className="hidden sm:block">
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
                        <PaginationItem className="hidden md:block">
                          <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem className="hidden sm:block">
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

                    {data?.hasNextPage && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page + 1)}>{page + 1}</PaginationLink>
                      </PaginationItem>
                    )}

                    {data?.hasNextPage && (
                      <PaginationItem className="hidden sm:block">
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => p + 1)}
                        className={cn(!data?.hasNextPage && "opacity-50 pointer-events-none")}
                        aria-disabled={!data?.hasNextPage}
                      />
                    </PaginationItem>
                    <PaginationItem className="hidden sm:block">
                      <PaginationNext10
                        onClick={() => setPage(p => p + 10)}
                        className={cn(!data?.hasNextPage && "opacity-50 pointer-events-none")}
                        aria-disabled={!data?.hasNextPage}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </YomirraSurface>
    </div>
  );
}



export default function LibraryPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <LibrarySkeleton />
        </YomirraSurface>
      </div>
    }>
      <LibraryContent />
    </React.Suspense>
  );
}
