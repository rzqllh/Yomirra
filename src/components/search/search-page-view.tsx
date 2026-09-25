"use client";

import * as React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { HeaderActions } from "@/components/app/header-actions";
import { useSearchCatalog } from "@/shared/hooks/use-search-catalog";
import { SearchToolbar } from "./search-toolbar";
import { SearchSourceRail } from "./search-source-rail";
import { SearchResults } from "./search-results";

import { YomirraSurface } from "@/components/ui/layout";

export function SearchPageView() {
  const search = useSearchCatalog();

  return (
    <YomirraSurface variant="base" className="min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-10">
      <div className="px-4 md:px-8 max-w-9xl mx-auto space-y-5">
        {/* Document Flow Header */}
        <div className="pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8">
          <PageHeader
            title="Pencarian"
            description="Temukan komik dari berbagai sumber"
            icon={<MagnifyingGlass size={24} weight="duotone" />}
            actions={<HeaderActions />}
          />
        </div>

        <div className="space-y-5 md:space-y-4 md:rounded-xl md:border md:border-border-subtle md:bg-surface-raised/30 md:p-5">
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
        </div>

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
    </YomirraSurface>
  );
}
