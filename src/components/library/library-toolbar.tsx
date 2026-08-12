"use client";

import * as React from "react";
import { Funnel } from "@phosphor-icons/react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { LibraryFilterDrawer } from "./library-filter-drawer";
import { cn } from "@/shared/utils/cn";

export interface LibraryToolbarProps {
  searchInput: string;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSearchClear: () => void;
  activeSourceId: string;
  activeFilterCount: number;
}

export function LibraryToolbar({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  activeSourceId,
  activeFilterCount,
}: LibraryToolbarProps) {
  return (
    <div className="flex items-center gap-2.5 mt-6 md:mt-7">
      <SearchInput
        value={searchInput}
        onChange={onSearchInputChange}
        onSubmitAction={onSearchSubmit}
        onClear={onSearchClear}
        placeholder="Cari di library..."
        containerClassName="flex-1 min-w-0 h-[44px]"
      />

      <LibraryFilterDrawer activeSourceId={activeSourceId}>
        <Button
          variant={activeFilterCount > 0 ? "accent" : "outline"}
          className={cn(
            "shrink-0 h-[44px] px-4 rounded-2xl font-bold gap-1.5 transition-all duration-300",
            activeFilterCount === 0 && "bg-surface-glass backdrop-blur-md text-text-primary border-border-subtle"
          )}
          aria-label={`Filter ${activeFilterCount > 0 ? `(${activeFilterCount} aktif)` : ""}`}
        >
          <Funnel size={18} weight={activeFilterCount > 0 ? "fill" : "bold"} />
          <span>Filter</span>
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </Button>
      </LibraryFilterDrawer>
    </div>
  );
}
