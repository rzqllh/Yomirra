"use client";

import * as React from "react";
import Link from "next/link";
import { BookBookmark, Compass, MagnifyingGlass, Plus, PencilSimple, Trash, Folder } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaGrid } from "@/components/komik/manga-grid";
import { ShelfCard } from "@/components/komik/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { CollectionToolbar } from "./collection-toolbar";
import { CollectionSelectionToolbar } from "./collection-selection-toolbar";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { CreateCollectionModal, RenameCollectionModal } from "@/components/collection/collection-modals";
import { getLibraryHref } from "@/shared/lib/routes";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { PageToolbar } from "@/components/ui/layout";
import { cn } from "@/shared/utils/cn";
import type { Collection } from "@/shared/types/collection";
import type {
  SmartCollection,
  SmartCollectionId,
} from "@/shared/lib/smart-collections";

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
  // Custom collection props
  collections?: Collection[];
  membershipsByManga?: Record<string, string[]>;
  selectedCollectionId?: string | null;
  onSelectCollectionId?: (id: string | null) => void;
  smartCollections?: SmartCollection[];
  selectedSmartCollectionId?: SmartCollectionId | null;
  onSelectSmartCollectionId?: (id: SmartCollectionId | null) => void;
  onClearCollectionFilters?: () => void;
  onCreateCollection?: (name: string) => void;
  onRenameCollection?: (id: string, name: string) => void;
  onDeleteCollection?: (id: string) => void;
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
  collections = [],
  membershipsByManga = {},
  selectedCollectionId = null,
  onSelectCollectionId,
  smartCollections = [],
  selectedSmartCollectionId = null,
  onSelectSmartCollectionId,
  onClearCollectionFilters,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
}: CollectionTabProps) {
  // Dialog states for collection management
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [activeCollectionId, setActiveCollectionId] = React.useState<string | null>(null);

  const handleCreate = (name: string) => {
    try {
      onCreateCollection?.(name);
      toast.success("Koleksi dibuat", {
        description: `Koleksi "${name}" siap digunakan.`,
      });
    } catch (err: any) {
      toast.error("Koleksi gagal dibuat", {
        description: err?.message || "Periksa kembali nama koleksi dan coba lagi.",
      });
    }
  };

  const handleRename = (name: string) => {
    if (!activeCollectionId) return;
    try {
      onRenameCollection?.(activeCollectionId, name);
      toast.success("Nama koleksi diperbarui", {
        description: `Koleksi diubah menjadi "${name}".`,
      });
      setActiveCollectionId(null);
    } catch (err: any) {
      toast.error("Nama koleksi gagal diperbarui", {
        description: err?.message || "Periksa kembali nama koleksi dan coba lagi.",
      });
    }
  };

  const handleDelete = () => {
    if (!activeCollectionId) return;
    onDeleteCollection?.(activeCollectionId);
    if (selectedCollectionId === activeCollectionId) {
      onSelectCollectionId?.(null);
    }
    toast.info("Koleksi dihapus", {
      description: "Komik di dalamnya tetap tersimpan di Rak Buku.",
    });
    setIsDeleteOpen(false);
    setActiveCollectionId(null);
  };

  const getMangaCount = (collectionId: string) => {
    return Object.values(membershipsByManga).filter((ids) => ids.includes(collectionId)).length;
  };

  const visibleSmartCollections = smartCollections.filter(
    (collection) =>
      collection.items.length > 0 || collection.id === selectedSmartCollectionId
  );
  const hasCollectionFilter =
    Boolean(selectedCollectionId) || Boolean(selectedSmartCollectionId);

  const clearCollectionFilters = () => {
    if (onClearCollectionFilters) {
      onClearCollectionFilters();
      return;
    }
    onSelectCollectionId?.(null);
    onSelectSmartCollectionId?.(null);
  };

  return (
    <div
      role="tabpanel"
      id="tabpanel-collection"
      aria-labelledby="tab-collection"
      className="space-y-4"
    >
      <PageToolbar>
        <CollectionToolbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearchClear={onSearchClear}
          sortBy={sortBy}
          onSortChange={onSortChange}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={onToggleSelectionMode}
          totalCount={totalItemsCount}
          onCreateCollectionClick={() => {
            setNewName("");
            setIsCreateOpen(true);
          }}
        />

        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Otomatis
              </span>
              <span className="text-[11px] text-text-muted/70">
                Dari aktivitas bacamu
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
              <FilterChip
                label={
                  <span className="flex items-center gap-1.5">
                    <span>Semua</span>
                    <span className="text-[11px] opacity-70">{totalItemsCount}</span>
                  </span>
                }
                aria-label={`Semua bookmark, ${totalItemsCount} judul`}
                selected={!hasCollectionFilter}
                variant={!hasCollectionFilter ? "accent-solid" : "default"}
                onClick={clearCollectionFilters}
                className="shrink-0"
              />

              {visibleSmartCollections.map((collection) => {
                const isSelected = selectedSmartCollectionId === collection.id;
                return (
                  <FilterChip
                    key={collection.id}
                    label={
                      <span className="flex items-center gap-1.5">
                        <span>{collection.label}</span>
                        <span className="text-[11px] opacity-70">
                          {collection.items.length}
                        </span>
                      </span>
                    }
                    aria-label={`${collection.label}, ${collection.items.length} judul`}
                    selected={isSelected}
                    variant={isSelected ? "accent-solid" : "default"}
                    onClick={() =>
                      onSelectSmartCollectionId?.(
                        isSelected ? null : collection.id
                      )
                    }
                    className="shrink-0"
                  />
                );
              })}
            </div>
          </div>

          {collections.length > 0 && (
            <div>
              <div className="mb-2 px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Koleksi Kamu
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
                {collections.map((collection) => {
                  const isSelected = selectedCollectionId === collection.id;
                  const count = getMangaCount(collection.id);

                  return (
                    <div
                      key={collection.id}
                      className="relative flex items-center shrink-0 group"
                    >
                      <FilterChip
                        label={
                          <span className="flex items-center gap-1.5">
                            <Folder size={14} weight="duotone" />
                            <span>{collection.name}</span>
                            <span className="text-[11px] opacity-70">{count}</span>
                          </span>
                        }
                        aria-label={`${collection.name}, ${count} judul`}
                        selected={isSelected}
                        variant={isSelected ? "accent-solid" : "default"}
                        onClick={() =>
                          onSelectCollectionId?.(
                            isSelected ? null : collection.id
                          )
                        }
                        className="shrink-0"
                      />

                      {isSelected && (
                        <div className="flex items-center ml-1 gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveCollectionId(collection.id);
                              setNewName(collection.name);
                              setIsRenameOpen(true);
                            }}
                            className="w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle hover:text-text-primary text-text-muted flex items-center justify-center transition-colors"
                            aria-label={`Ubah nama ${collection.name}`}
                          >
                            <PencilSimple size={13} weight="duotone" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveCollectionId(collection.id);
                              setIsDeleteOpen(true);
                            }}
                            className="w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle hover:text-semantic-error text-text-muted flex items-center justify-center transition-colors"
                            aria-label={`Hapus ${collection.name}`}
                          >
                            <Trash size={13} weight="duotone" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PageToolbar>

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
          title="Belum ada bookmark"
          description="Komik yang kamu simpan akan muncul di sini."
          action={
            <Button asChild variant="accent" className="rounded-xl shadow-sm font-bold mt-4">
              <Link href={getLibraryHref()}>
                <Compass size={20} weight="bold" className="mr-1.5" />
                Jelajahi Library
              </Link>
            </Button>
          }
        />
      ) : filteredCount === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={48} className="text-text-muted" weight="duotone" />}
          title="Bookmark tidak ditemukan"
          description={
            hasCollectionFilter
              ? "Belum ada bookmark yang masuk kategori ini."
              : `Tidak ada bookmark yang cocok dengan kata kunci "${searchQuery}".`
          }
          action={
            hasCollectionFilter ? (
              <Button
                variant="outline"
                onClick={clearCollectionFilters}
                className="rounded-xl shadow-sm font-bold mt-4"
              >
                Tampilkan semua bookmark
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onSearchClear}
                className="rounded-xl shadow-sm font-bold mt-4"
              >
                Hapus pencarian
              </Button>
            )
          }
        />
      ) : (
        <>
          <MangaGrid>
            {paginatedCollection.map((manga) => {
              const itemKey = `${manga.sourceId}::${manga.mangaId}`;
              const isSelected = selectedItems.has(itemKey);

              return (
                <div key={itemKey} className="relative group h-full flex flex-col">
                  <div inert={isSelectionMode ? true : undefined} className="h-full flex flex-col">
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
                  </div>

                  {isSelectionMode && (
                    <button
                      type="button"
                      onClick={() => onToggleSelectItem(itemKey)}
                      className={cn(
                        "absolute inset-0 z-20 rounded-xl flex items-start justify-end p-2.5 motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        isSelected
                          ? "bg-accent/20 border-2 border-accent"
                          : "bg-black/40 hover:bg-black/50 border border-white/20"
                      )}
                      aria-label={`${isSelected ? "Batal pilih" : "Pilih"} ${manga.title}`}
                      aria-pressed={isSelected}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center motion-safe:transition-transform motion-safe:duration-200",
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

      {/* Create Modal */}
      <CreateCollectionModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Rename Modal */}
      <RenameCollectionModal
        isOpen={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        initialName={newName}
        onSubmit={handleRename}
      />

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus koleksi?"
        description="Folder koleksi ini akan dihapus. Komik di dalamnya tidak akan terhapus dari Rak Buku."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
