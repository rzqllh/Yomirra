"use client";

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { Funnel, X, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchFilterDrawerProps {
  children?: React.ReactNode;
}

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
  "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
  "Sports", "Supernatural", "Thriller", "Isekai", "Mecha"
];

const STATUSES = [
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "hiatus", label: "Hiatus" },
  { id: "cancelled", label: "Cancelled" }
];

const SORTS = [
  { id: "popular", label: "Paling Populer" },
  { id: "latest", label: "Update Terbaru" },
  { id: "alphabetical", label: "A-Z" }
];

export function SearchFilterDrawer({ children }: SearchFilterDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Local state for filters before applying
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("popular");

  // Sync from URL when opening
  const handleOpenChange = (open: boolean) => {
    if (open) {
      const genres = searchParams?.get("genres")?.split(",").filter(Boolean) || [];
      const status = searchParams?.get("status") || "";
      const sort = searchParams?.get("sort") || "popular";
      
      setSelectedGenres(genres);
      setSelectedStatus(status);
      setSelectedSort(sort);
    }
    setIsOpen(open);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    if (selectedGenres.length > 0) {
      params.set("genres", selectedGenres.join(","));
    } else {
      params.delete("genres");
    }

    if (selectedStatus) {
      params.set("status", selectedStatus);
    } else {
      params.delete("status");
    }

    if (selectedSort !== "popular") {
      params.set("sort", selectedSort);
    } else {
      params.delete("sort");
    }

    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedStatus("");
    setSelectedSort("popular");
  };

  const activeCount = selectedGenres.length + (selectedStatus ? 1 : 0) + (selectedSort !== "popular" ? 1 : 0);

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Trigger asChild>
        {children || (
          <Button 
            variant={activeCount > 0 ? "accent" : "outline"} 
            className="rounded-full px-5 h-12 gap-2"
          >
            <Funnel size={18} weight={activeCount > 0 ? "fill" : "bold"} />
            Filter {activeCount > 0 && `(${activeCount})`}
          </Button>
        )}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-surface-base flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none max-h-[90vh] shadow-heavy">
          <div className="p-4 bg-surface-base rounded-t-[32px] flex-1 overflow-y-auto [scrollbar-width:none]">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border-strong mb-6" />
            
            <div className="flex items-center justify-between mb-6 px-2">
              <Drawer.Title className="text-xl font-bold">Filter Pencarian</Drawer.Title>
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
                  {SORTS.map(sort => (
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

              {/* Status */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(status => (
                    <button
                      key={status.id}
                      onClick={() => setSelectedStatus(status.id === selectedStatus ? "" : status.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5",
                        selectedStatus === status.id
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong"
                      )}
                    >
                      {selectedStatus === status.id && <Check size={14} weight="bold" />}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Genre</h3>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold transition-all border",
                          isSelected
                            ? "bg-accent text-white border-transparent shadow-[0_0_12px_rgba(94,92,230,0.3)]"
                            : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong"
                        )}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-surface-base border-t border-border-subtle mt-auto sticky bottom-0">
            <Button 
              onClick={handleApply}
              className="w-full h-14 rounded-2xl text-[15px] font-bold bg-text-primary text-surface-base hover:bg-text-primary/90"
            >
              Terapkan Filter
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
