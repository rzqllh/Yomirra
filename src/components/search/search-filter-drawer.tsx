"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Funnel, X, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/shared/utils/cn";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useQuery, useQueries } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

interface SearchFilterDrawerProps {
  children?: React.ReactNode;
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

export function SearchFilterDrawer({ children }: SearchFilterDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const storeFilters = useSearchFilterStore();

  // Local state for filters before applying
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [selectedSort, setSelectedSort] = React.useState<string>("popular");
  const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
  const [localSources, setLocalSources] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Set initial filter state
    if (storeFilters.selectedSources) {
      setSelectedSources(storeFilters.selectedSources);
    }
    
    // Load local sources
    const loadLocal = () => setLocalSources(dynamicSourceRegistry.getAll());
    loadLocal();
    
    const handleUpdate = () => loadLocal();
    window.addEventListener("sources_updated", handleUpdate);
    return () => window.removeEventListener("sources_updated", handleUpdate);
  }, [storeFilters.selectedSources]);

  // Sync selected sources with store changes
  React.useEffect(() => {
    if (storeFilters.selectedSources && isOpen) {
      setSelectedSources(storeFilters.selectedSources);
    }
  }, [storeFilters.selectedSources, isOpen]);

  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const { data: healthStats } = useQuery({
    queryKey: ["sources-health"],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 60000,
  });

  const hideNsfw = useSettingsStore(state => state.hideNsfw);

  const searchableSources = React.useMemo(() => {
    const s = [...(sourcesData || [])];
    localSources.forEach(ls => {
      if (!s.find(x => x.id === ls.id)) {
        s.push(ls);
      }
    });
    
    return s.filter(s => {
      if (!s.isInstalled || !s.capabilities.search) return false;
      if (s.isNsfw && hideNsfw) return false;
      return true;
    }).map(source => {
      const health = healthStats?.[source.id];
      if (health) {
        return {
          ...source,
          status: health.status as any,
        };
      }
      return source;
    });
  }, [sourcesData, localSources, healthStats, hideNsfw]);

  const sourcesToFetch = selectedSources.length > 0 
    ? searchableSources.filter(s => selectedSources.includes(s.id))
    : searchableSources;

  const filtersQueries = useQueries({
    queries: sourcesToFetch.map(s => ({
      queryKey: ["filters", s.id],
      queryFn: () => apiClient.getFilters(s.id),
      staleTime: Infinity,
    }))
  });

  const dynamicFilters = React.useMemo(() => {
    const genres = new Map<string, string>();
    const statuses = new Map<string, string>();
    const sorts = new Map<string, string>();
    const formats = new Map<string, string>();

    filtersQueries.forEach(query => {
      if (query.data) {
        query.data.genres?.forEach(g => genres.set(g.id, g.name));
        query.data.statuses?.forEach(s => statuses.set(s.id, s.name));
        query.data.sorts?.forEach(s => sorts.set(s.id, s.name));
        query.data.formats?.forEach(f => formats.set(f.id, f.name));
      }
    });

    const finalGenres = Array.from(genres.values()).sort();
    const finalStatuses = statuses.size > 0 
      ? Array.from(statuses.entries()).map(([id, label]) => ({ id, label }))
      : DEFAULT_STATUSES;
    const finalSorts = sorts.size > 0
      ? Array.from(sorts.entries()).map(([id, label]) => ({ id, label }))
      : DEFAULT_SORTS;
    const finalFormats = Array.from(formats.entries()).map(([id, label]) => ({ id, label }));

    return { genres: finalGenres, statuses: finalStatuses, sorts: finalSorts, formats: finalFormats };
  }, [filtersQueries]);
  
  const [selectedFormats, setSelectedFormats] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    // Sync filter state from store when drawer opens
    if (isOpen) {
      setSelectedSources(storeFilters.selectedSources || []);
      setSelectedGenres(storeFilters.genres);
      setSelectedFormats(storeFilters.formats || []);
      setSelectedStatus(storeFilters.status);
      setSelectedSort(storeFilters.sort);
    }
  }, [isOpen, storeFilters]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const toggleSource = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    storeFilters.applyFilters({
      genres: selectedGenres,
      formats: selectedFormats,
      status: selectedStatus,
      sort: selectedSort
    });
    if (selectedSources.length > 0) {
      storeFilters.setSelectedSources(selectedSources);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedStatus("");
    setSelectedSort("popular");
  };

  const activeCount = storeFilters.genres.length + (storeFilters.formats?.length || 0) + (storeFilters.status ? 1 : 0) + (storeFilters.sort !== "popular" ? 1 : 0);

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
                  {dynamicFilters.sorts.map(sort => (
                    <FilterChip
                      key={sort.id}
                      onClick={() => setSelectedSort(sort.id)}
                      variant={selectedSort === sort.id ? "inverted" : "default"}
                      label={sort.label}
                    />
                  ))}
                </div>
              </div>

              {/* Sumber */}
              {(searchableSources.length > 0 || true) && (
                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Sumber</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchableSources.map(source => {
                      const isSelected = selectedSources.includes(source.id);
                      const isOffline = source.status === "unavailable";
                      
                      return (
                        <FilterChip
                          key={source.id}
                          onClick={() => toggleSource(source.id)}
                          variant={isSelected ? "accent-subtle" : isOffline ? "offline" : "default"}
                          showCheck={isSelected}
                          showDownBadge={isOffline}
                          label={source.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tipe / Format */}
              {dynamicFilters.formats.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Tipe Komik</h3>
                  <div className="flex flex-wrap gap-2">
                    {dynamicFilters.formats.map(format => (
                      <FilterChip
                        key={format.id}
                        onClick={() => toggleFormat(format.id)}
                        variant={selectedFormats.includes(format.id) ? "accent-subtle" : "default"}
                        showCheck={selectedFormats.includes(format.id)}
                        label={format.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {dynamicFilters.statuses.map(status => (
                    <FilterChip
                      key={status.id}
                      onClick={() => setSelectedStatus(status.id === selectedStatus ? "" : status.id)}
                      variant={selectedStatus === status.id ? "accent-subtle" : "default"}
                      showCheck={selectedStatus === status.id}
                      label={status.label}
                    />
                  ))}
                </div>
              </div>

              {/* Genre */}
              {dynamicFilters.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Genre</h3>
                  <div className="flex flex-wrap gap-2">
                    {dynamicFilters.genres.map(genre => {
                      const isSelected = selectedGenres.includes(genre);
                      return (
                        <FilterChip
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          variant={isSelected ? "accent-solid" : "default"}
                          label={genre}
                        />
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
