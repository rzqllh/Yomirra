"use client";

import * as React from "react";
import Link from "next/link";
import { BookBookmark, Compass, MagnifyingGlass, Plus, PencilSimple, Trash, Folder } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaGrid } from "@/components/manga/manga-grid";
import { ShelfCard } from "@/components/manga/card";
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
import { cn } from "@/shared/utils/cn";
import type { Collection } from "@/shared/types/collection";

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
      toast.success("Koleksi berhasil dibuat");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat koleksi");
    }
  };

  const handleRename = (name: string) => {
    if (!activeCollectionId) return;
    try {
      onRenameCollection?.(activeCollectionId, name);
      toast.success("Koleksi berhasil diubah");
      setActiveCollectionId(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah koleksi");
    }
  };

  const handleDelete = () => {
    if (!activeCollectionId) return;
    onDeleteCollection?.(activeCollectionId);
    if (selectedCollectionId === activeCollectionId) {
      onSelectCollectionId?.(null);
    }
    toast.success("Koleksi berhasil dihapus");
    setIsDeleteOpen(false);
    setActiveCollectionId(null);
  };

  const getMangaCount = (collectionId: string) => {
    return Object.values(membershipsByManga).filter((ids) => ids.includes(collectionId)).length;
  };

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

      {/* User Collection Filter Rail */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
        <FilterChip
          label={`Semua (${totalItemsCount})`}
          selected={!selectedCollectionId}
          variant={!selectedCollectionId ? "accent-solid" : "default"}
          onClick={() => onSelectCollectionId?.(null)}
          className="shrink-0"
        />

        {collections.map((c) => {
          const isSelected = selectedCollectionId === c.id;
          const count = getMangaCount(c.id);

          return (
            <div key={c.id} className="relative flex items-center shrink-0 group">
              <FilterChip
                label={
                  <span className="flex items-center gap-1.5">
                    <Folder size={14} weight="duotone" />
                    <span>{c.name}</span>
                    <span className="text-[11px] opacity-70">({count})</span>
                  </span>
                }
                selected={isSelected}
                variant={isSelected ? "accent-solid" : "default"}
                onClick={() => onSelectCollectionId?.(isSelected ? null : c.id)}
                className="shrink-0"
              />

              {isSelected && (
                <div className="flex items-center ml-1 gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCollectionId(c.id);
                      setNewName(c.name);
                      setIsRenameOpen(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle hover:text-text-primary text-text-muted flex items-center justify-center transition-colors"
                    aria-label={`Ubah nama ${c.name}`}
                  >
                    <PencilSimple size={13} weight="duotone" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCollectionId(c.id);
                      setIsDeleteOpen(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle hover:text-semantic-error text-text-muted flex items-center justify-center transition-colors"
                    aria-label={`Hapus ${c.name}`}
                  >
                    <Trash size={13} weight="duotone" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewName("");
            setIsCreateOpen(true);
          }}
          className="h-[36px] rounded-xl px-3 text-xs font-bold shrink-0 border-dashed border-border-strong hover:border-accent hover:text-accent gap-1"
        >
          <Plus size={14} weight="bold" />
          <span>Koleksi Baru</span>
        </Button>
      </div>

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
            <Button asChild variant="accent" className="rounded-xl shadow-sm font-bold mt-4">
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
          description={
            selectedCollectionId
              ? "Belum ada komik yang ditambahkan ke koleksi ini."
              : `Tidak ada komik yang cocok dengan kata kunci "${searchQuery}".`
          }
          action={
            selectedCollectionId ? (
              <Button
                variant="outline"
                onClick={() => onSelectCollectionId?.(null)}
                className="rounded-xl shadow-sm font-bold mt-4"
              >
                Tampilkan Semua Komik
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onSearchClear}
                className="rounded-xl shadow-sm font-bold mt-4"
              >
                Hapus Pencarian
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
                <div key={itemKey} className="relative group">
                  <div inert={isSelectionMode ? true : undefined}>
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
        title="Hapus Koleksi?"
        description="Folder koleksi ini akan dihapus. Komik di dalamnya tidak akan terhapus dari Rak Buku."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
