"use client";

import * as React from "react";
import { SearchTagInput } from "@/components/search/search-tag-input";
import type { MergedFilterList } from "@/shared/utils/filter-helpers";
import { SearchFilterDrawer } from "@/components/search/search-filter-drawer";
import { ViewModeToggle } from "@/components/komik/view-mode-toggle";

export interface SearchToolbarProps {
  localQuery: string;
  onQueryChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onQueryClear: () => void;
  filters: MergedFilterList;
  committedQuery: string;
  onResetRouteIntent?: () => void;
}

export function SearchToolbar({
  localQuery,
  onQueryChange,
  onSearchSubmit,
  onQueryClear,
  filters,
  committedQuery,
  onResetRouteIntent,
}: SearchToolbarProps) {
  return (
    <div className="flex gap-2.5 items-center">
      <SearchTagInput
        value={localQuery}
        onChange={onQueryChange}
        onSubmit={onSearchSubmit}
        onClear={onQueryClear}
        filters={filters}
      />
      <ViewModeToggle className="min-h-11" />
      <SearchFilterDrawer
        committedQuery={committedQuery}
        onResetRouteIntent={onResetRouteIntent}
      />
    </div>
  );
}
