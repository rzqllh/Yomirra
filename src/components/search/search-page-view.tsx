"use client";

import * as React from "react";
import { HeaderActions } from "@/components/app/header-actions";
import { YomirraSurface, PageContainer, PageToolbar } from "@/components/ui/layout";
import { CatalogControls } from "@/components/ui/catalog-controls";
import { useSearchCatalog } from "@/shared/hooks/use-search-catalog";
import { SearchToolbar } from "./search-toolbar";
import { SearchSourceRail } from "./search-source-rail";
import { SearchResults } from "./search-results";

export function SearchPageView() {
  const search = useSearchCatalog();

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer>
        {/* Mobile Utility Actions (hidden on desktop where TopNav is canonical) */}
        <div className="flex items-center justify-between w-full md:hidden">
          <span className="font-bold text-xs uppercase tracking-[0.14em] text-accent">Pencarian</span>
          <HeaderActions />
        </div>

        <h1 className="sr-only">Pencarian</h1>

        <CatalogControls label="Cari dan saring komik">
          <PageToolbar>
            <SearchToolbar
              localQuery={search.localQuery}
              onQueryChange={(e) => search.setLocalQuery(e.target.value)}
              onSearchSubmit={search.handleSearchSubmit}
              onQueryClear={() => search.setLocalQuery("")}
            />
            <SearchSourceRail
              searchableSources={search.searchableSources}
              activeSelectedSources={search.activeSelectedSources}
              onToggleSource={search.toggleSource}
            />
          </PageToolbar>
        </CatalogControls>

        {/* Results & Pagination */}
        <SearchResults
          activeSelectedSources={search.activeSelectedSources}
          searchableSources={search.searchableSources}
          errorsToDisplay={search.errorsToDisplay}
          isInitialLoading={search.isInitialLoading}
          allSourcesFailed={search.allSourcesFailed}
          searchMangas={search.searchMangas}
          query={search.query}
          hasActiveFilters={search.hasActiveFilters}
          page={search.page}
          setPage={search.setPage}
          hasNextPage={search.hasNextPage}
          queryClient={search.queryClient}
        />
      </PageContainer>
    </YomirraSurface>
  );
}
