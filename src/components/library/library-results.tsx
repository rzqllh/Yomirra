"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { 
  Funnel, 
  SmileySad, 
  Books, 
  MagnifyingGlass,
  Check
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaGrid, MANGA_GRID_CLASS, MANGA_COMPACT_GRID_CLASS } from "@/components/manga/manga-grid";
import { ShelfCard } from "@/components/manga/card";
import { CompactCard } from "@/components/manga/card/compact-card";
import { MangaGridSkeleton } from "@/components/skeletons/manga-grid-skeleton";
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
import { cn } from "@/shared/utils/cn";

export interface LibraryResultsProps {
  isDisabled: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  mangas: any[];
  viewMode: "grid" | "list" | "compact";
  activeSourceId: string;
  libraryItems: Record<string, any>;
  selectedCollections: string[];
  selectedGenres: string[];
  excludedGenres: string[];
  selectedFormats: string[];
  selectedStatuses: string[];
  selectedReadingStatuses: string[];
  query: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasNextPage?: boolean;
  onResetFilters: () => void;
  
  // Selection mode props
  isSelectionMode?: boolean;
  selectedItems?: Set<string>;
  onToggleSelectItem?: (key: string) => void;
}

export function LibraryResults({
  isDisabled,
  isLoading,
  isError,
  isFetching,
  refetch,
  mangas,
  viewMode,
  activeSourceId,
  libraryItems,
  selectedCollections,
  selectedGenres,
  excludedGenres,
  selectedFormats,
  selectedStatuses,
  selectedReadingStatuses,
  query,
  page,
  setPage,
  hasNextPage,
  onResetFilters,
  isSelectionMode,
  selectedItems,
  onToggleSelectItem,
}: LibraryResultsProps) {
  const router = useRouter();

  if (isDisabled) {
    return (
      <EmptyState
        icon={<Funnel size={40} className="text-text-muted" weight="duotone" />}
        title="Sumber ini sedang mati"
        description="Aktifkan lagi sumbernya untuk melihat komik di rakmu."
        action={
          <Button onClick={() => router.push("/sources")} variant="outline" className="mt-4 rounded-xl shadow-sm font-bold">
            Kelola Sumber
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="mt-4">
        <MangaGridSkeleton
          count={12}
          viewMode={viewMode === "compact" || viewMode === "list" ? "compact" : "grid"}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<SmileySad size={40} className="text-text-muted" weight="duotone" />}
        title="Gagal memuat katalog"
        description="Data dari sumber ini belum bisa dimuat. Coba lagi sebentar."
        action={
          <Button onClick={() => refetch()} variant="outline" className="mt-4 rounded-xl shadow-sm font-bold">
            Coba lagi
          </Button>
        }
      />
    );
  }

  if (mangas.length === 0) {
    if (Object.keys(libraryItems).length === 0) {
      return (
        <EmptyState
          icon={<Books size={40} className="text-text-muted" weight="duotone" />}
          title="Rakmu masih kosong"
          description="Temukan komik yang kamu suka, lalu simpan di sini."
        />
      );
    }

    if (
      selectedCollections.length > 0 &&
      !query &&
      selectedGenres.length === 0 &&
      excludedGenres.length === 0 &&
      selectedFormats.length === 0 &&
      selectedStatuses.length === 0 &&
      selectedReadingStatuses.length === 0
    ) {
      return (
        <EmptyState
          icon={<Books size={40} className="text-text-muted" weight="duotone" />}
          title="Koleksi ini masih kosong"
          description="Simpan komik ke koleksi ini dari halaman detailnya."
        />
      );
    }

    return (
      <EmptyState
        icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
        title="Tidak ada yang cocok"
        description="Coba kata kunci lain atau kurangi filter."
        action={
          <Button onClick={onResetFilters} variant="outline" className="mt-4 rounded-xl shadow-sm font-bold">
            Hapus filter
          </Button>
        }
      />
    );
  }

  return (
    <>
      <LayoutGroup id="library-listing-cards">
        <motion.div
          layout
          transition={{ layout: { type: "spring", stiffness: 320, damping: 30 } }}
          className={cn(
            viewMode === "compact" || viewMode === "list" ? MANGA_COMPACT_GRID_CLASS : MANGA_GRID_CLASS,
            "transition-opacity duration-200",
            isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
          )}
        >
          {mangas.map(manga => {
            const itemKey = `${activeSourceId}::${manga.id}`;
            const isSelected = selectedItems?.has(itemKey);

            return (
              <div key={manga.id} className="relative group w-full">
                {viewMode === "grid" ? (
                  <ShelfCard manga={manga} sourceId={activeSourceId} showSourceBadge={true} />
                ) : (
                  <CompactCard manga={manga} sourceId={activeSourceId} showSourceBadge={true} />
                )}
                {isSelectionMode && onToggleSelectItem && (
                  <button
                    type="button"
                    onClick={() => onToggleSelectItem(itemKey)}
                    className={cn(
                      "absolute inset-0 z-20 rounded-xl flex items-start justify-end p-2.5 transition-all duration-200",
                      isSelected
                        ? "bg-accent/15 border-2 border-accent"
                        : "bg-surface-overlay/75 hover:bg-surface-overlay/90 border border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    )}
                    aria-label={`${isSelected ? "Batal pilih" : "Pilih"} ${manga.title}`}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-200",
                        isSelected
                          ? "bg-accent text-accent-on scale-110"
                          : "bg-surface-raised border border-border-strong"
                      )}
                    >
                      {isSelected && <Check size={16} weight="bold" aria-hidden="true" />}
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </motion.div>
      </LayoutGroup>

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

            {hasNextPage && (
              <PaginationItem>
                <PaginationLink onClick={() => setPage(page + 1)}>{page + 1}</PaginationLink>
              </PaginationItem>
            )}

            {hasNextPage && (
              <PaginationItem className="hidden sm:block">
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
            <PaginationItem className="hidden sm:block">
              <PaginationNext10
                onClick={() => setPage(p => p + 10)}
                className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                aria-disabled={!hasNextPage}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
