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
    <div className="flex gap-2.5 items-center">
      <SearchInput
        value={localQuery}
        onChange={onQueryChange}
        onSubmitAction={onSearchSubmit}
        placeholder="Judul apa yang mau kamu baca?"
        containerClassName="flex-1 min-w-0 min-h-11"
        onClear={onQueryClear}
      />
      <SearchFilterDrawer />
    </div>
  );
}
