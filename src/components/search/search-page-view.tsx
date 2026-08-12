"use client";

import * as React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { useSearchCatalog } from "@/shared/hooks/use-search-catalog";
import { SearchToolbar } from "./search-toolbar";
import { SearchSourceRail } from "./search-source-rail";
import { SearchResults } from "./search-results";

export function SearchPageView() {
  const search = useSearchCatalog();

  return (
    <main className="min-h-screen bg-surface-base pb-[calc(var(--bottom-nav-height,80px)+24px)]">
      <div className="px-4 max-w-7xl mx-auto space-y-5">
        {/* Document Flow Header */}
        <div className="pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8">
          <PageHeader
            title="Pencarian"
            description="Temukan komik dari berbagai sumber"
            icon={<MagnifyingGlass size={32} weight="duotone" />}
          />
        </div>

        {/* Search & Filter Row */}
        <SearchToolbar
          localQuery={search.localQuery}
          onQueryChange={(e) => search.setLocalQuery(e.target.value)}
          onSearchSubmit={search.handleSearchSubmit}
          onQueryClear={() => search.setLocalQuery("")}
        />

        {/* Source Control Rail */}
        <SearchSourceRail
          searchableSources={search.searchableSources}
          activeSelectedSources={search.activeSelectedSources}
          onToggleSource={search.toggleSource}
        />

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
      </div>
    </main>
  );
}
