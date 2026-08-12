"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { WarningCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { MangaGrid } from "@/components/manga/manga-grid";
import { ShelfCard } from "@/components/manga/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationNext10,
  PaginationPrevious10,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/shared/utils/cn";
import type { SourceMetadata } from "@/shared/sources/source-types";

export interface SearchResultsProps {
  activeSelectedSources: string[];
  searchableSources: SourceMetadata[];
  errorsToDisplay: { sourceId: string; error: string }[];
  isInitialLoading: boolean;
  allSourcesFailed: boolean;
  searchMangas: { manga: any; sourceId: string }[];
  query: string;
  hasActiveFilters: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasNextPage: boolean;
  queryClient: any;
}

export function SearchResults({
  activeSelectedSources,
  searchableSources,
  errorsToDisplay,
  isInitialLoading,
  allSourcesFailed,
  searchMangas,
  query,
  hasActiveFilters,
  page,
  setPage,
  hasNextPage,
  queryClient,
}: SearchResultsProps) {
  return (
    <>
      {/* Partial Failure Warning (Compact) */}
      {errorsToDisplay.length > 0 && !allSourcesFailed && (
        <div className="flex flex-col gap-2">
          {errorsToDisplay.map((err) => {
            const source = searchableSources.find((s) => s.id === err.sourceId);
            return (
              <div
                key={err.sourceId}
                className="flex items-center justify-between p-3 rounded-xl bg-semantic-error/10 border border-semantic-error/20 text-xs font-semibold text-semantic-error"
              >
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
          <motion.div
            key="no-source"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-8"
          >
            <EmptyState
              icon={<WarningCircle size={40} className="text-accent" weight="duotone" />}
              title="Tidak ada sumber aktif yang dipilih"
              description="Pilih setidaknya satu sumber di atas untuk mulai mencari."
            />
          </motion.div>
        ) : isInitialLoading && searchMangas.length === 0 ? (
          <motion.div
            key="loading-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SearchResultSkeleton />
          </motion.div>
        ) : allSourcesFailed && searchMangas.length === 0 ? (
          <motion.div
            key="global-error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-8"
          >
            <EmptyState
              icon={<WarningCircle size={40} className="text-semantic-error" weight="duotone" />}
              title={
                activeSelectedSources.length === 1
                  ? `${
                      searchableSources.find((s) => s.id === activeSelectedSources[0])?.name ||
                      activeSelectedSources[0]
                    } tidak dapat dimuat`
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
                      queryClient.invalidateQueries({
                        queryKey: ["searchSource", activeSelectedSources[0]],
                      });
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
          <motion.div
            key="results-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2 text-text-primary tracking-tight">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                {query.length === 0 ? "Update Terbaru" : "Hasil Pencarian"}
              </h2>
              <span className="text-xs font-semibold text-text-muted">
                {searchMangas.length} {query.length === 0 ? "judul" : "hasil"}
              </span>
            </div>

            <MangaGrid>
              {searchMangas.map((item) => (
                <ShelfCard
                  key={`${item.sourceId}-${item.manga.id}`}
                  sourceId={item.sourceId}
                  manga={item.manga}
                  showSourceBadge={true}
                  priority={false}
                />
              ))}
            </MangaGrid>

            {/* Pagination */}
            <div className="mt-8 py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious10
                      onClick={() => setPage((p) => Math.max(1, p - 10))}
                      className={cn(page <= 10 && "opacity-50 pointer-events-none")}
                      aria-disabled={page <= 10}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setPage((p) => p + 1)}
                      className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                      aria-disabled={!hasNextPage}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext10
                      onClick={() => setPage((p) => p + 10)}
                      className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                      aria-disabled={!hasNextPage}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search-empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-8"
          >
            <EmptyState
              icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
              title={
                hasActiveFilters
                  ? "Tidak ada komik yang cocok dengan filter"
                  : query.length > 0
                  ? "Tidak ada komik yang ditemukan"
                  : "Tidak ada komik ditemukan"
              }
              description={
                hasActiveFilters
                  ? "Coba sesuaikan atau reset filter pencarian."
                  : query.length > 0
                  ? "Coba gunakan kata kunci lain."
                  : "Pilih sumber lain untuk menampilkan komik."
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
