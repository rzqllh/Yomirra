"use client";

import * as React from "react";
import { YomirraSurface, PageContainer, PageToolbar } from "@/components/ui/layout";
import { CatalogControls } from "@/components/ui/catalog-controls";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { PageHeader } from "@/components/app/header";
import { useLibraryCatalog } from "@/shared/hooks/use-library-catalog";
import { LibraryToolbar } from "./library-toolbar";
import { LibraryStatusRail } from "./library-status-rail";
import { LibraryResults } from "./library-results";
import { GuestSyncBanner } from "./guest-sync-banner";

export function LibraryPageView() {
  const catalog = useLibraryCatalog();

  if (!catalog.isMounted) {
    return (
      <YomirraSurface variant="base" className="w-full">
        <PageContainer hasMobileHeader>
          <LibrarySkeleton />
        </PageContainer>
      </YomirraSurface>
    );
  }

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Library"
          subtitle="Jelajahi katalog dari sumber yang kamu pilih."
          hideDesktop
        />

        <h1 className="sr-only">Library</h1>

        <CatalogControls label="Pencarian dan filter Library">
          <PageToolbar>
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
              onResetRouteIntent={catalog.resetFilterRouteIntent}
            />

            <LibraryStatusRail
              sort={catalog.sort}
              onTabChange={catalog.handleTabChange}
              dynamicSorts={catalog.DYNAMIC_SORTS}
              selectedFormats={catalog.selectedFormats}
              onPageReset={() => catalog.setPage(1)}
            />
          </PageToolbar>
        </CatalogControls>

        <GuestSyncBanner />

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
      </PageContainer>
    </YomirraSurface>
  );
}
