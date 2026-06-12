"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { MangaCard } from "@/components/manga/manga-card";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
import { MagnifyingGlass, CircleNotch, SmileySad, X, Funnel, Books, Clock } from "@phosphor-icons/react";
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
import { useSettingsStore } from "@/shared/store/settings-store";

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
  const activeSourceId = "shinigami";
  const searchParams = useSearchParams();
  
  const sortParam = searchParams.get("sort");
  const initialSort = sortParam === "popular" || sortParam === "latest" ? sortParam : "all";
  
  const [searchInput, setSearchInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"popular" | "latest" | "all">(initialSort);
  const [page, setPage] = React.useState(1);
  
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = React.useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);

  const { data: filtersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
  });

  const isNsfwFiltered = useSettingsStore(state => state.hideNsfw);

  const GENRES = filtersData?.genres || [];
  const DYNAMIC_FORMATS = filtersData?.formats || FORMATS;
  const DYNAMIC_STATUSES = filtersData?.statuses || STATUSES;

  const fetchCatalog = async (currentPage: number) => {
    const filters: Record<string, string | string[]> = {};
    if (sort === "latest") filters.sort = "latest";
    else if (sort === "popular") filters.sort = "popularity";
    else filters.sort = "latest"; // Fallback for "all" to prevent empty results

    
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
    queryKey: ["library-v2", activeSourceId, query, sort, selectedGenres, excludedGenres, selectedFormats, selectedStatuses, page, isNsfwFiltered],
    queryFn: () => fetchCatalog(page),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
  };

  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (newSort: "popular" | "latest" | "all") => {
    setSort(newSort);
    setPage(1);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "all") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    
    // Use replace to avoid polluting browser history on tab switches
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleGenre = (id: string) => {
    setPage(1);
    if (selectedGenres.includes(id)) {
      setSelectedGenres(prev => prev.filter(g => g !== id));
      setExcludedGenres(prev => [...prev, id]);
    } else if (excludedGenres.includes(id)) {
      setExcludedGenres(prev => prev.filter(g => g !== id));
    } else {
      setSelectedGenres(prev => [...prev, id]);
    }
  };

  const toggleFilter = (id: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    setPage(1);
    if (state.includes(id)) {
      setState(prev => prev.filter(i => i !== id));
    } else {
      setState(prev => [...prev, id]);
    }
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setExcludedGenres([]);
    setSelectedFormats([]);
    setSelectedStatuses([]);
    setQuery("");
    setSearchInput("");
    setPage(1);
  };

  const activeFilterCount = selectedGenres.length + excludedGenres.length + selectedFormats.length + selectedStatuses.length;
  const mangas = data?.mangas || [];

  // Scroll to top when page changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <MobilePageShell title="Library">
      <div className="flex flex-col min-h-screen bg-surface-base">
        <main className="flex-1 w-full max-w-7xl mx-auto pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-8">
          <div className="px-4 py-6 md:px-8 md:py-8 space-y-8">
            
            {/* Header Section */}
            <div className="hidden md:flex flex-col space-y-4">
              <div>
                <h1 className="text-3xl font-black text-text-primary tracking-tight">Library</h1>
                <p className="text-text-muted mt-1 text-sm md:text-base">Jelajahi berbagai koleksi komik dari sumber pilihanmu.</p>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-medium text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Books size={18} weight="fill" className="text-accent" />
                  <span>Menjelajah dari Shinigami</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-border-strong" />
                <div className="flex items-center gap-1.5">
                  <Clock size={18} weight="fill" className="text-accent" />
                  <span>Diperbarui setiap hari</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs & Search/Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-subtle pb-4">
              <div className="flex gap-6 overflow-x-auto w-full md:w-auto hide-scrollbar">
                <button 
                  onClick={() => handleTabChange("all")}
                  className={cn(
                    "pb-2 text-sm md:text-base font-bold whitespace-nowrap border-b-2 transition-colors",
                    sort === "all" ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  Semua Judul
                </button>
                <button 
                  onClick={() => handleTabChange("latest")}
                  className={cn(
                    "pb-2 text-sm md:text-base font-bold whitespace-nowrap border-b-2 transition-colors",
                    sort === "latest" ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  Update Terbaru
                </button>
                <button 
                  onClick={() => handleTabChange("popular")}
                  className={cn(
                    "pb-2 text-sm md:text-base font-bold whitespace-nowrap border-b-2 transition-colors",
                    sort === "popular" ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  Populer
                </button>
              </div>

              <div className="flex w-full md:w-auto items-center gap-3">
                <form 
                  onSubmit={handleSearchSubmit} 
                  className="flex-1 md:w-64 flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1.5 transition-all duration-200 focus-within:bg-surface-overlay focus-within:ring-2 focus-within:ring-accent border border-border-subtle shadow-sm"
                >
                  <MagnifyingGlass className="size-4 text-text-muted shrink-0" weight="bold" />
                  <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari..." 
                    className="flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
                  />
                  {query && (
                    <button type="button" onClick={() => { setSearchInput(""); setQuery(""); setPage(1); }} className="p-0.5 rounded-full bg-surface-base hover:bg-surface-overlay text-text-muted hover:text-text-primary transition-colors">
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </form>

                <Button
                  variant={activeFilterCount > 0 ? "default" : "outline"}
                  size="sm"
                  className={cn("rounded-full font-bold gap-1.5 shadow-sm", activeFilterCount > 0 ? "bg-accent text-white" : "bg-surface-raised")}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Funnel size={16} weight={activeFilterCount > 0 ? "fill" : "bold"} />
                  Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </div>
            </div>

            {/* Collapsible Filters Section */}
            {showFilters && (
              <div className="bg-surface-base border border-border-subtle rounded-[var(--radius-xl)] p-6 shadow-sm motion-safe:animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  
                  {/* Left Side: Genre */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Genre</h3>
                      <span className="text-xs text-text-muted italic bg-surface-raised px-2 py-0.5 rounded-full border border-border-subtle">
                        Klik: Include (Biru) ➔ Exclude (Merah) ➔ Netral
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(g => {
                        const isInc = selectedGenres.includes(g.id);
                        const isExc = excludedGenres.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            onClick={() => toggleGenre(g.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border",
                              isInc ? "bg-accent/20 border-accent text-accent shadow-sm" : 
                              isExc ? "bg-semantic-error/20 border-semantic-error text-semantic-error shadow-sm" : 
                              "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted"
                            )}
                          >
                            {isExc && <span className="mr-1 font-black">-</span>}{g.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side: Format & Status */}
                  <div className="md:col-span-5 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-border-subtle pt-6 md:pt-0 md:pl-8">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Format</h3>
                      <div className="flex flex-wrap gap-2">
                        {DYNAMIC_FORMATS.map(f => (
                          <button
                            key={f.id}
                            onClick={() => toggleFilter(f.id, selectedFormats, setSelectedFormats)}
                            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border", selectedFormats.includes(f.id) ? "bg-accent text-accent-foreground border-transparent shadow-sm" : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary")}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {DYNAMIC_STATUSES.map(s => (
                          <button
                            key={s.id}
                            onClick={() => toggleFilter(s.id, selectedStatuses, setSelectedStatuses)}
                            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border", selectedStatuses.includes(s.id) ? "bg-accent text-accent-foreground border-transparent shadow-sm" : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary")}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Catalog Content Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MangaCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                variant="compact"
                icon={<SmileySad size={40} className="text-text-muted" weight="duotone" />}
                title="Gagal memuat katalog"
                description="Terjadi kesalahan saat mengambil data dari Shinigami."
                action={<Button onClick={() => refetch()} variant="outline" className="mt-2">Coba lagi</Button>}
                className="bg-surface-base rounded-[var(--radius-xl)] border border-border-subtle py-16"
              />
            ) : mangas.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
                title="Manga tidak ditemukan"
                description="Coba ubah kombinasi filter atau kata kunci pencarian."
                action={<Button onClick={resetFilters} variant="outline" className="mt-2">Reset Filter</Button>}
                className="bg-surface-base rounded-[var(--radius-xl)] border border-border-subtle border-dashed py-16"
              />
            ) : (
              <>
                {/* Opacity transition when fetching next/prev pages */}
                <div className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 transition-opacity duration-200",
                  isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
                )}>
                  {mangas.map((manga, idx) => (
                    <MangaCard key={`${manga.id}-${idx}`} manga={manga} sourceId={activeSourceId} variant="shelf" />
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
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={cn(page === 1 && "opacity-50 pointer-events-none")}
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

                      {data?.hasNextPage && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setPage(page + 1)}>{page + 1}</PaginationLink>
                        </PaginationItem>
                      )}

                      {data?.hasNextPage && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(p => p + 1)}
                          className={cn(!data?.hasNextPage && "opacity-50 pointer-events-none")}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext10
                          onClick={() => setPage(p => p + 10)}
                          className={cn(!data?.hasNextPage && "opacity-50 pointer-events-none")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </MobilePageShell>
  );
}

import { DirectionalTransition } from "@/components/ui/directional-transition";

export default function LibraryPage() {
  return (
    <DirectionalTransition>
      <React.Suspense fallback={
        <MobilePageShell title="Library">
          <div className="flex flex-col min-h-screen bg-surface-base items-center justify-center">
            <CircleNotch size={32} className="motion-safe:animate-spin text-accent" />
          </div>
        </MobilePageShell>
      }>
        <LibraryContent />
      </React.Suspense>
    </DirectionalTransition>
  );
}
