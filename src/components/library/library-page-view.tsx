"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { YomirraSurface, PageContainer, PageToolbar } from "@/components/ui/layout";
import { CatalogControls } from "@/components/ui/catalog-controls";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { HeaderActions } from "@/components/app/header-actions";
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
        <PageContainer>
          <LibrarySkeleton />
        </PageContainer>
      </YomirraSurface>
    );
  }

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer>
        <h1 className="sr-only">Library</h1>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <Link
            href="/sources"
            className="inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-border-default bg-surface-raised px-3 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>Sumber: <strong className="text-text-primary">{catalog.activeSourceId}</strong></span>
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
          <HeaderActions />
        </div>

        <CatalogControls label="Cari dan saring rak bacaan">
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
