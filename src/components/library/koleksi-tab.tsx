"use client";

import * as React from "react";
import { useLibraryCatalog } from "@/shared/hooks/use-library-catalog";
import { LibraryToolbar } from "./library-toolbar";
import { LibraryStatusRail } from "./library-status-rail";
import { LibraryCollectionRail } from "./library-collection-rail";
import { LibraryResults } from "./library-results";
import { CollectionSelectionToolbar } from "@/components/bookmark/collection-selection-toolbar";
import { useLibraryStore } from "@/shared/store/library-store";
import { toast } from "sonner";

export function KoleksiTab() {
  const catalog = useLibraryCatalog();
  const removeFromLibrary = useLibraryStore((state) => state.removeFromLibrary);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Instead of deeply modifying LibraryResults, we can just pass the Selection toolbar
  // above it. 
  // Wait, the items in the grid need to be selectable. 
  // The MangaGrid / ShelfCard need to know if we are in selection mode.
  // In BookmarkPageView's CollectionTab, ShelfCard wasn't directly used for selection?
  // Let's check how CollectionTab did selection on manga cards.
  // It passed `isSelectionMode` to what?
  return (
    <>
      {/* Search & Filter Row */}
      <LibraryToolbar
        searchInput={catalog.searchInput}
        onSearchInputChange={(e) => catalog.setSearchInput(e.target.value)}
        onSearchSubmit={catalog.handleSearchSubmit}
        onSearchClear={() => {
          catalog.setSearchInput("");
          catalog.setQuery("");
          catalog.setPage(1);
        }}
        activeSourceId={catalog.activeSourceId}
        activeFilterCount={catalog.activeFilterCount}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          if (isSelectionMode) setSelectedItems(new Set());
        }}
      />

      {/* Quick Sort & Reading Status Row */}
      <LibraryStatusRail
        sort={catalog.sort}
        onTabChange={catalog.handleTabChange}
        dynamicSorts={catalog.DYNAMIC_SORTS}
        selectedFormats={catalog.selectedFormats}
        onPageReset={() => catalog.setPage(1)}
      />

      {/* Collections Rail */}
      <LibraryCollectionRail
        collections={catalog.collections}
        libraryItems={catalog.libraryItems}
        getMemberships={catalog.getMemberships}
        activeSourceId={catalog.activeSourceId}
        selectedCollections={catalog.selectedCollections}
        onPageReset={() => catalog.setPage(1)}
      />

      {isSelectionMode && (
        <CollectionSelectionToolbar
          selectedCount={selectedItems.size}
          totalCount={catalog.mangas?.length || 0}
          onSelectAll={() => {
            if (selectedItems.size === catalog.mangas.length) {
              setSelectedItems(new Set());
            } else {
              setSelectedItems(new Set(catalog.mangas.map((m) => `${catalog.activeSourceId}::${m.id}`)));
            }
          }}
          onCancelSelection={() => {
            setIsSelectionMode(false);
            setSelectedItems(new Set());
          }}
          isDeleteDialogOpen={isDeleteDialogOpen}
          onOpenDeleteDialogChange={setIsDeleteDialogOpen}
          onConfirmBulkDelete={() => {
            const count = selectedItems.size;
            selectedItems.forEach((key) => {
              const [sourceId, mangaId] = key.split("::");
              if (sourceId && mangaId) {
                removeFromLibrary(sourceId, mangaId);
              }
            });
            setSelectedItems(new Set());
            setIsSelectionMode(false);
            setIsDeleteDialogOpen(false);
            toast.success(`${count} manga dihapus dari bookmark`);
            catalog.refetch();
          }}
        />
      )}

      {/* Results Section */}
      <LibraryResults
        isDisabled={catalog.isDisabled}
        isLoading={catalog.isLoading}
        isError={catalog.isError}
        isFetching={catalog.isFetching}
        refetch={catalog.refetch}
        mangas={catalog.mangas}
        viewMode={catalog.viewMode}
        activeSourceId={catalog.activeSourceId}
        libraryItems={catalog.libraryItems}
        selectedCollections={catalog.selectedCollections}
        selectedGenres={catalog.selectedGenres}
        excludedGenres={catalog.excludedGenres}
        selectedFormats={catalog.selectedFormats}
        selectedStatuses={catalog.selectedStatuses}
        selectedReadingStatuses={catalog.selectedReadingStatuses}
        query={catalog.query}
        page={catalog.page}
        setPage={catalog.setPage}
        hasNextPage={catalog.data?.hasNextPage}
        onResetFilters={catalog.resetFilters}
        isSelectionMode={isSelectionMode}
        selectedItems={selectedItems}
        onToggleSelectItem={(key) => {
          setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
      />
    </>
  );
}
