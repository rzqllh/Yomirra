"use client";

import * as React from "react";
import { Books } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { useLibraryCatalog } from "@/shared/hooks/use-library-catalog";
import { LibraryToolbar } from "./library-toolbar";
import { LibraryStatusRail } from "./library-status-rail";
import { LibraryCollectionRail } from "./library-collection-rail";
import { LibraryResults } from "./library-results";

export function LibraryPageView() {
  const catalog = useLibraryCatalog();

  if (!catalog.isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <LibrarySkeleton />
        </YomirraSurface>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Library Yomirra</h1>
      <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 md:py-8">
          {/* 1. Header Section */}
          <PageHeader
            title="Library"
            description="Koleksi komik dan riwayat bacaan favoritmu."
            icon={<Books size={32} weight="duotone" />}
            meta={<span className="text-sm font-bold text-text-muted">{catalog.totalLibraryCount} judul</span>}
          />

          {/* 2. Search & Filter Row */}
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
          />

          {/* 3. Quick Sort & Reading Status Row */}
          <LibraryStatusRail
            sort={catalog.sort}
            onTabChange={catalog.handleTabChange}
            dynamicSorts={catalog.DYNAMIC_SORTS}
            selectedReadingStatuses={catalog.selectedReadingStatuses}
            onPageReset={() => catalog.setPage(1)}
          />

          {/* 4. Collections Rail */}
          <LibraryCollectionRail
            collections={catalog.collections}
            libraryItems={catalog.libraryItems}
            membershipsByManga={catalog.membershipsByManga}
            activeSourceId={catalog.activeSourceId}
            selectedCollections={catalog.selectedCollections}
            onPageReset={() => catalog.setPage(1)}
          />

          {/* 5. Results Section */}
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
          />
        </div>
      </YomirraSurface>
    </div>
  );
}
