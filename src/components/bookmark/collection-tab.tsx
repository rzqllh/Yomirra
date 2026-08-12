"use client";

import * as React from "react";
import Link from "next/link";
import { BookBookmark, Compass, MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaGrid } from "@/components/manga/manga-grid";
import { ShelfCard } from "@/components/manga/card";
import { CollectionToolbar } from "./collection-toolbar";
import { CollectionSelectionToolbar } from "./collection-selection-toolbar";
import { getLibraryHref } from "@/shared/lib/routes";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/shared/utils/cn";

export interface CollectionTabProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  sortBy: "updatedAt" | "title";
  onSortChange: (v: "updatedAt" | "title") => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedItems: Set<string>;
  onToggleSelectItem: (key: string) => void;
  onSelectAll: () => void;
  isDeleteDialogOpen: boolean;
  onOpenDeleteDialogChange: (open: boolean) => void;
  onConfirmBulkDelete: () => void;
  totalItemsCount: number;
  filteredCount: number;
  paginatedCollection: any[];
  collectionPage: number;
  setCollectionPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export function CollectionTab({
  searchQuery,
  onSearchChange,
  onSearchClear,
  sortBy,
  onSortChange,
  isSelectionMode,
  onToggleSelectionMode,
  selectedItems,
  onToggleSelectItem,
  onSelectAll,
  isDeleteDialogOpen,
  onOpenDeleteDialogChange,
  onConfirmBulkDelete,
  totalItemsCount,
  filteredCount,
  paginatedCollection,
  collectionPage,
  setCollectionPage,
  totalPages,
}: CollectionTabProps) {
  return (
    <div
      role="tabpanel"
      id="tabpanel-collection"
      aria-labelledby="tab-collection"
      className="space-y-4"
    >
      <CollectionToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchClear={onSearchClear}
        sortBy={sortBy}
        onSortChange={onSortChange}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={onToggleSelectionMode}
        totalCount={totalItemsCount}
      />

      {isSelectionMode && (
        <CollectionSelectionToolbar
          selectedCount={selectedItems.size}
          totalCount={filteredCount}
          onSelectAll={onSelectAll}
          onCancelSelection={onToggleSelectionMode}
          isDeleteDialogOpen={isDeleteDialogOpen}
          onOpenDeleteDialogChange={onOpenDeleteDialogChange}
          onConfirmBulkDelete={onConfirmBulkDelete}
        />
      )}

      {totalItemsCount === 0 ? (
        <EmptyState
          icon={<BookBookmark size={48} className="text-text-muted" weight="duotone" />}
          title="Koleksi masih kosong"
          description="Simpan manga favoritmu ke koleksi agar mudah diakses kembali kapan saja."
          action={
            <Button asChild variant="accent" className="rounded-full shadow-sm font-bold mt-4">
              <Link href={getLibraryHref()}>
                <Compass size={20} weight="bold" className="mr-1.5" />
                Eksplor Manga
              </Link>
            </Button>
          }
        />
      ) : filteredCount === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={48} className="text-text-muted" weight="duotone" />}
          title="Manga tidak ditemukan"
          description={`Tidak ada komik yang cocok dengan kata kunci "${searchQuery}".`}
          action={
            <Button
              variant="outline"
              onClick={onSearchClear}
              className="rounded-full shadow-sm font-bold mt-4"
            >
              Hapus Pencarian
            </Button>
          }
        />
      ) : (
        <>
          <MangaGrid>
            {paginatedCollection.map((manga) => {
              const itemKey = `${manga.sourceId}::${manga.mangaId}`;
              const isSelected = selectedItems.has(itemKey);

              return (
                <div key={itemKey} className="relative group">
                  <ShelfCard
                    manga={{
                      id: manga.mangaId,
                      title: manga.title,
                      coverUrl: manga.coverUrl,
                      status: manga.status,
                    }}
                    sourceId={manga.sourceId}
                    showSourceBadge={true}
                  />

                  {isSelectionMode && (
                    <button
                      type="button"
                      onClick={() => onToggleSelectItem(itemKey)}
                      className={cn(
                        "absolute inset-0 z-20 rounded-2xl flex items-start justify-end p-2.5 transition-all duration-200",
                        isSelected
                          ? "bg-accent/20 border-2 border-accent"
                          : "bg-black/40 hover:bg-black/50 border border-white/20"
                      )}
                      aria-label={`${isSelected ? "Batal pilih" : "Pilih"} ${manga.title}`}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200",
                          isSelected
                            ? "bg-accent text-white scale-110"
                            : "bg-surface-glass border border-white/40"
                        )}
                      >
                        {isSelected && <span className="text-xs font-black">✓</span>}
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </MangaGrid>

          {totalPages > 1 && (
            <div className="mt-8 py-4">
              <Pagination>
                <PaginationContent className="gap-1 sm:gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCollectionPage((p) => Math.max(1, p - 1))}
                      className={cn(collectionPage === 1 && "opacity-50 pointer-events-none")}
                      aria-disabled={collectionPage === 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= collectionPage - 1 && p <= collectionPage + 1)
                    ) {
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === collectionPage}
                            onClick={() => setCollectionPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (p === collectionPage - 2 || p === collectionPage + 2) {
                      return (
                        <PaginationItem key={p} className="hidden sm:block">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCollectionPage((p) => Math.min(totalPages, p + 1))}
                      className={cn(
                        collectionPage === totalPages && "opacity-50 pointer-events-none"
                      )}
                      aria-disabled={collectionPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
