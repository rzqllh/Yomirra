"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { 
  Funnel, 
  SmileySad, 
  Books, 
  MagnifyingGlass 
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaGrid, MANGA_GRID_CLASS } from "@/components/manga/manga-grid";
import { ShelfCard, HistoryCard } from "@/components/manga/card";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
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
  viewMode: "grid" | "list";
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
}: LibraryResultsProps) {
  const router = useRouter();

  if (isDisabled) {
    return (
      <EmptyState
        icon={<Funnel size={40} className="text-text-muted" weight="duotone" />}
        title="Sumber Dinonaktifkan"
        description="Kamu telah menonaktifkan sumber ini. Aktifkan kembali di halaman Sumber untuk melihat pustaka."
        action={
          <Button onClick={() => router.push("/sources")} variant="outline" className="mt-4 rounded-full shadow-sm font-bold">
            Kelola Sumber
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className={cn(viewMode === "grid" ? MANGA_GRID_CLASS : "flex flex-col gap-3")}>
        {Array.from({ length: 12 }).map((_, i) => (
          <MangaCardSkeleton key={i} variant={viewMode === "grid" ? "shelf" : "history"} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<SmileySad size={40} className="text-text-muted" weight="duotone" />}
        title="Gagal memuat katalog"
        description="Terjadi kesalahan saat mengambil data dari sumber."
        action={
          <Button onClick={() => refetch()} variant="outline" className="mt-4 rounded-full shadow-sm font-bold">
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
          title="Library Kosong"
          description="Belum ada manga yang ditambahkan ke Library."
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
        action={
          <Button onClick={onResetFilters} variant="outline" className="mt-4 rounded-full shadow-sm font-bold">
            Reset Filter
          </Button>
        }
      />
    );
  }

  return (
    <>
      <motion.div
        layout
        className={cn(
          viewMode === "grid" ? MANGA_GRID_CLASS : "flex flex-col gap-3",
          "transition-opacity duration-200",
          isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
      >
        <AnimatePresence>
          {mangas.map(manga =>
            viewMode === "grid" ? (
              <ShelfCard key={manga.id} manga={manga} sourceId={activeSourceId} showSourceBadge={true} />
            ) : (
              <HistoryCard key={manga.id} manga={manga} sourceId={activeSourceId} />
            )
          )}
        </AnimatePresence>
      </motion.div>

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
