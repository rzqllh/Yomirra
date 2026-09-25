"use client";

import * as React from "react";
import { ArrowRight, Books } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";
import { CatalogControls } from "@/components/ui/catalog-controls";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { useLibraryCatalog } from "@/shared/hooks/use-library-catalog";
import { LibraryToolbar } from "./library-toolbar";
import { LibraryStatusRail } from "./library-status-rail";
import { LibraryResults } from "./library-results";
import { GuestSyncBanner } from "./guest-sync-banner";

import Link from "next/link";
import { HeaderActions } from "@/components/app/header-actions";

export function LibraryPageView() {
  const catalog = useLibraryCatalog();

  if (!catalog.isMounted) {
    return (
      <div className="flex flex-col w-full">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
          <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 md:py-8">
            <LibrarySkeleton />
          </div>
        </YomirraSurface>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] pb-28 md:pt-8 md:px-8 md:py-8">
          <PageHeader
            title="Rak Bacaan"
            description="Komik yang kamu simpan, siap dibaca lagi kapan saja."
            icon={<Books size={24} weight="duotone" />}
            actions={<HeaderActions />}
          />

          <div className="flex items-center mb-4 md:hidden">
            <Link
              href="/sources"
              className="inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-border-default bg-surface-raised px-3 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span>Sumber: <strong className="text-text-primary">{catalog.activeSourceId}</strong></span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>

          <CatalogControls label="Cari dan saring rak bacaan">
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
        </div>
      </YomirraSurface>
    </div>
  );
}
