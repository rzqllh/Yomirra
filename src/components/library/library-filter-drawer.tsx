"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Funnel, X, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";

interface LibraryFilterDrawerProps {
  children?: React.ReactNode;
  activeSourceId: string;
}

const DEFAULT_STATUSES = [
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "hiatus", label: "Hiatus" },
  { id: "cancelled", label: "Cancelled" }
];

const DEFAULT_SORTS = [
  { id: "popular", label: "Paling Populer" },
  { id: "latest", label: "Update Terbaru" },
  { id: "alphabetical", label: "A-Z" }
];

export function LibraryFilterDrawer({ children, activeSourceId }: LibraryFilterDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const storeFilters = useLibraryFilterStore();

  // Local state for filters before applying
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [selectedSort, setSelectedSort] = React.useState<string>("popular");
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>([]);

  const { data: filtersData } = useQuery({
    queryKey: ["filters", activeSourceId],
    queryFn: () => apiClient.getFilters(activeSourceId),
    staleTime: Infinity,
  });

  const dynamicFilters = React.useMemo(() => {
    const genres = filtersData?.genres?.map((g: any) => ({ id: g.id, label: g.name })) || [];
    const finalStatuses = filtersData?.statuses && filtersData.statuses.length > 0 
      ? filtersData.statuses.map((s: any) => ({ id: s.id, label: s.name }))
      : DEFAULT_STATUSES;
    const finalSorts = filtersData?.sorts && filtersData.sorts.length > 0
      ? filtersData.sorts.map((s: any) => ({ id: s.id, label: s.name }))
      : DEFAULT_SORTS;
    const finalFormats = filtersData?.formats?.map((f: any) => ({ id: f.id, label: f.name })) || [];

    return { genres, statuses: finalStatuses, sorts: finalSorts, formats: finalFormats };
  }, [filtersData]);

  
  React.useEffect(() => {
    // Sync filter state from store when drawer opens
    if (isOpen) {
      setSelectedGenres(storeFilters.selectedGenres || []);
      setExcludedGenres(storeFilters.excludedGenres || []);
      setSelectedFormats(storeFilters.selectedFormats || []);
      setSelectedStatus(storeFilters.selectedStatuses || []);
      setSelectedSort(storeFilters.sort || "popular");
    }
  }, [isOpen, storeFilters]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(prev => prev.filter(g => g !== genreId));
      setExcludedGenres(prev => [...prev, genreId]);
    } else if (excludedGenres.includes(genreId)) {
      setExcludedGenres(prev => prev.filter(g => g !== genreId));
    } else {
      setSelectedGenres(prev => [...prev, genreId]);
    }
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatus(prev => 
      prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]
    );
  };

  const handleApply = () => {
    storeFilters.setFilters({
      selectedGenres,
      excludedGenres,
      selectedFormats,
      selectedStatuses: selectedStatus,
      sort: selectedSort
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setExcludedGenres([]);
    setSelectedFormats([]);
    setSelectedStatus([]);
    setSelectedSort("popular");
  };

  const activeCount = selectedGenres.length + excludedGenres.length + selectedFormats.length + selectedStatus.length + (selectedSort !== "popular" ? 1 : 0);

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Trigger asChild>
        {children || (
          <Button 
            variant={activeCount > 0 ? "accent" : "outline"} 
            className={cn(
              "rounded-full font-bold px-5 h-[44px] gap-1.5 transition-all duration-300",
              activeCount > 0 
                ? "shadow-md" 
                : "bg-surface-glass backdrop-blur-md text-text-primary hover:bg-surface-glass hover:text-text-primary shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            )}
          >
            <Funnel size={16} weight={activeCount > 0 ? "fill" : "bold"} />
            Filter {activeCount > 0 && `(${activeCount})`}
          </Button>
        )}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-surface-base flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none max-h-[90vh] shadow-heavy">
          <div className="p-4 bg-surface-base rounded-t-[32px] flex-1 overflow-y-auto [scrollbar-width:none] touch-manipulation relative z-0" style={{ WebkitOverflowScrolling: "touch", transform: "translate3d(0,0,0)" }} data-vaul-no-drag>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border-strong mb-6" />
            
            <div className="flex items-center justify-between mb-6 px-2">
              <Drawer.Title className="text-xl font-bold">Filter Pencarian</Drawer.Title>
              <Drawer.Description className="sr-only">Atur filter pencarian berdasarkan urutan, status, dan genre manga.</Drawer.Description>
              {activeCount > 0 && (
                <button 
                  onClick={handleReset}
                  className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-8 px-2 pb-24">
              {/* Urutkan */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Urutkan</h3>
                <div className="flex flex-wrap gap-2">
                  {dynamicFilters.sorts.map((sort: any) => (
                    <button
                      key={sort.id}
                      onClick={() => setSelectedSort(sort.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all border",
                        selectedSort === sort.id
                          ? "bg-text-primary text-surface-base border-transparent"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong"
                      )}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>



              {/* Tipe / Format */}
              {dynamicFilters.formats.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Tipe Komik</h3>
                  <div className="flex flex-wrap gap-2">
                    {dynamicFilters.formats.map((format: any) => (
                      <button
                        key={format.id}
                        onClick={() => toggleFormat(format.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 active:scale-[0.98]",
                          selectedFormats.includes(format.id)
                            ? "bg-accent/10 border-accent text-accent"
                            : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong"
                        )}
                      >
                        {selectedFormats.includes(format.id) && <Check size={14} weight="bold" />}
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {dynamicFilters.statuses.map((status: any) => (
                    <button
                      key={status.id}
                      onClick={() => toggleStatus(status.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5",
                        selectedStatus.includes(status.id)
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong"
                      )}
                    >
                      {selectedStatus.includes(status.id) && <Check size={14} weight="bold" />}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre */}
              {dynamicFilters.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Genre</h3>
                  <div className="flex flex-wrap gap-2">
                    {dynamicFilters.genres.map((genre: any) => {
                      const isInc = selectedGenres.includes(genre.id);
                      const isExc = excludedGenres.includes(genre.id);
                      return (
                        <button
                          key={genre.id}
                          onClick={() => toggleGenre(genre.id)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all border",
                            isInc
                              ? "bg-accent text-white border-transparent shadow-[0_0_12px_rgba(94,92,230,0.3)]"
                              : isExc
                              ? "bg-semantic-error text-white border-transparent shadow-[0_0_12px_rgba(255,59,48,0.3)]"
                              : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong"
                          )}
                        >
                          {isExc && <span className="mr-1 font-black">-</span>}{genre.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-surface-base border-t border-border-subtle shrink-0 relative z-10" style={{ transform: "translate3d(0,0,0)" }}>
            <Button 
              onClick={handleApply}
              className="w-full h-14 rounded-2xl text-[15px] font-bold bg-text-primary text-surface-base hover:bg-text-primary/90 active:scale-[0.98] transition-transform duration-200"
            >
              Terapkan Filter
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
