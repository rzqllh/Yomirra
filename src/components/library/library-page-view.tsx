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
import { GuestSyncBanner } from "./guest-sync-banner";

import Link from "next/link";
import { HeaderActions } from "@/components/app/header-actions";

export function LibraryPageView() {
  const catalog = useLibraryCatalog();

  if (!catalog.isMounted) {
    return (
      <YomirraSurface variant="base" className="min-h-screen">
        <div className="mx-auto flex w-full max-w-9xl flex-col pb-8 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
          <LibrarySkeleton />
        </div>
      </YomirraSurface>
    );
  }

  return (
    <>
      <h1 className="sr-only">Library Komik Yomirra</h1>
      <span className="sr-only">Jelajah</span>
      <YomirraSurface variant="base" className="min-h-screen">
        <div className="mx-auto flex w-full max-w-9xl flex-col px-4 pb-28 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8 md:pb-8">
          <PageHeader
            title="Library"
            description="Semua yang kamu simpan, dari berbagai sumber, dalam satu tempat."
            icon={<Books size={24} weight="duotone" />}
            actions={<HeaderActions />}
          />

          {/* Source context row — below nav bar, above search/filter */}
          <div className="flex items-center mb-3 md:hidden">
            <Link
              href="/sources"
              className="text-[11px] tracking-wider font-extrabold px-2.5 py-1 rounded-[8px] bg-accent/10 border border-accent/25 text-accent flex items-center gap-1.5 hover:bg-accent/20 transition-all shadow-xs active:scale-95"
            >
              <span>Sumber Aktif: <strong className="uppercase">{catalog.activeSourceId}</strong></span>
              <span className="text-[10px]">&rarr;</span>
            </Link>
          </div>

          <div className="md:rounded-xl md:border md:border-border-subtle md:bg-surface-raised/30 md:px-5 md:py-4">
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
          </div>

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
    </>
  );
}
