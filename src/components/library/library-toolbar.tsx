"use client";

import * as React from "react";
import { Funnel } from "@phosphor-icons/react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { LibraryFilterDrawer } from "./library-filter-drawer";
import { ViewModeToggle } from "@/components/manga/view-mode-toggle";
import { cn } from "@/shared/utils/cn";

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
    <div className="flex items-center gap-2 mt-4 md:mt-6">
      <SearchInput
        value={searchInput}
        onChange={onSearchInputChange}
        onSubmitAction={onSearchSubmit}
        onClear={onSearchClear}
        placeholder="Cari judul komik..."
        containerClassName="flex-1 min-w-0 h-[42px] rounded-xl"
      />

      <ViewModeToggle className="h-[42px]" />

      <LibraryFilterDrawer activeSourceId={activeSourceId}>
        <Button
          variant={activeFilterCount > 0 ? "accent" : "outline"}
          className={cn(
            "shrink-0 h-[42px] px-3.5 rounded-xl font-bold gap-1.5 transition-all duration-200",
            activeFilterCount === 0 && "bg-surface-glass backdrop-blur-md text-text-primary border-border-subtle hover:border-border-strong"
          )}
          aria-label={`Filter ${activeFilterCount > 0 ? `(${activeFilterCount} aktif)` : ""}`}
        >
          <Funnel size={17} weight={activeFilterCount > 0 ? "fill" : "bold"} />
          <span className="hidden xs:inline sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-black bg-accent text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </LibraryFilterDrawer>

      {onToggleSelectionMode && (
        <Button
          variant={isSelectionMode ? "accent" : "outline"}
          onClick={onToggleSelectionMode}
          className={cn(
            "shrink-0 h-[44px] px-4 rounded-2xl font-bold transition-all duration-300",
            !isSelectionMode && "bg-surface-glass backdrop-blur-md text-text-primary border-border-subtle"
          )}
          aria-label={isSelectionMode ? "Batal pilih" : "Pilih manga"}
        >
          {isSelectionMode ? "Batal" : "Pilih"}
        </Button>
      )}
    </div>
  );
}
