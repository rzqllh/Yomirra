"use client";

import * as React from "react";
import { PageHeader } from "@/components/app/header";
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
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Cari"
          subtitle="Temukan komik dari berbagai sumber."
          hideDesktop
        />

        <h1 className="sr-only">Cari</h1>

        <CatalogControls label="Pencarian dan filter">
          <PageToolbar>
            <SearchToolbar
              localQuery={search.localQuery}
              onQueryChange={search.setLocalQuery}
              onSearchSubmit={search.handleSearchSubmit}
              onQueryClear={() => search.setLocalQuery("")}
              filters={search.dynamicFilters}
              committedQuery={search.query}
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
          hasSearchIntent={search.hasSearchIntent}
        />
      </PageContainer>
    </YomirraSurface>
  );
}
