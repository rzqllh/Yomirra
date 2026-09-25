"use client";

import * as React from "react";
import { Funnel } from "@phosphor-icons/react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { LibraryFilterDrawer } from "./library-filter-drawer";
import { ViewModeToggle } from "@/components/manga/view-mode-toggle";

export interface LibraryToolbarProps {
  searchInput: string;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSearchClear: () => void;
  activeSourceId: string;
  activeFilterCount: number;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export function LibraryToolbar({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  activeSourceId,
  activeFilterCount,
  isSelectionMode,
  onToggleSelectionMode,
}: LibraryToolbarProps) {
  return (
    <div className="flex items-center gap-2 mt-4 md:mt-0">
      <SearchInput
        value={searchInput}
        onChange={onSearchInputChange}
        onSubmitAction={onSearchSubmit}
        onClear={onSearchClear}
        placeholder="Cari di rak bacaan..."
        containerClassName="flex-1 min-w-0 min-h-11 rounded-xl"
      />

      <ViewModeToggle className="min-h-11" />

      <LibraryFilterDrawer activeSourceId={activeSourceId}>
        <Button
          variant={activeFilterCount > 0 ? "accent" : "outline"}
          className="shrink-0 min-h-11 px-3 rounded-xl gap-1.5"
          aria-label={`Filter ${activeFilterCount > 0 ? `(${activeFilterCount} aktif)` : ""}`}
        >
          <Funnel size={17} weight={activeFilterCount > 0 ? "fill" : "bold"} />
          <span className="hidden xs:inline sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex min-w-6 min-h-6 items-center justify-center rounded-md bg-accent px-1 text-xs font-bold text-accent-on">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </LibraryFilterDrawer>

      {onToggleSelectionMode && (
        <Button
          variant={isSelectionMode ? "accent" : "outline"}
          onClick={onToggleSelectionMode}
          className="shrink-0 min-h-11 px-4"
          aria-label={isSelectionMode ? "Batal pilih" : "Pilih manga"}
          aria-pressed={Boolean(isSelectionMode)}
        >
          {isSelectionMode ? "Batal" : "Pilih"}
        </Button>
      )}
    </div>
  );
}
