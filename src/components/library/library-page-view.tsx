"use client";

import * as React from "react";
import { Books } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { useLibraryCatalog } from "@/shared/hooks/use-library-catalog";
import { LibraryToolbar } from "./library-toolbar";
import { LibraryStatusRail } from "./library-status-rail";
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
      <h1 className="sr-only">Jelajah Komik Yomirra</h1>
      <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 md:py-8">
          {/* 1. Header Section */}
          <PageHeader
            title="Jelajah"
            description="Eksplorasi manga dan komik dari berbagai sumber."
            icon={<Books size={24} weight="duotone" />}
            meta={
              <span className="uppercase text-[11px] tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                {catalog.activeSourceId}
              </span>
            }
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

          {/* 3. Quick Sort & Format Rail */}
          <LibraryStatusRail
            sort={catalog.sort}
            onTabChange={catalog.handleTabChange}
            dynamicSorts={catalog.DYNAMIC_SORTS}
            selectedFormats={catalog.selectedFormats}
            onPageReset={() => catalog.setPage(1)}
          />

          {/* 4. Results Section */}
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
