"use client";

import * as React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { SearchFilterDrawer } from "@/components/search/search-filter-drawer";

export interface SearchToolbarProps {
  localQuery: string;
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onQueryClear: () => void;
}

export function SearchToolbar({
  localQuery,
  onQueryChange,
  onSearchSubmit,
  onQueryClear,
}: SearchToolbarProps) {
  return (
    <div className="flex gap-2 items-center">
      <SearchInput
        value={localQuery}
        onChange={onQueryChange}
        onSubmitAction={onSearchSubmit}
        placeholder="Cari komik..."
        containerClassName="flex-1 h-[44px]"
        onClear={onQueryClear}
        autoFocus
      />
      <SearchFilterDrawer />
    </div>
  );
}
