"use client";

import * as React from "react";
import { Funnel } from "@phosphor-icons/react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { LibraryFilterDrawer } from "./library-filter-drawer";
import { ViewModeToggle } from "@/components/manga/view-mode-toggle";
import { DotsThreeVertical, CheckCircle } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { motion, useReducedMotion } from "motion/react";

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
  const reducedMotion = useReducedMotion();

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
          className={cn(
            "relative shrink-0 min-h-11 px-3 rounded-xl gap-1.5",
            activeFilterCount > 0 && "bg-accent text-accent-on border-accent/40 shadow-xs"
          )}
          aria-label={`Filter ${activeFilterCount > 0 ? `(${activeFilterCount} aktif)` : ""}`}
        >
          <Funnel size={17} weight={activeFilterCount > 0 ? "fill" : "bold"} />
          <span className="hidden xs:inline sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <motion.span
              key={activeFilterCount}
              initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-accent-on text-accent px-1 text-[11px] font-black shadow-xs"
            >
              {activeFilterCount}
            </motion.span>
          )}
        </Button>
      </LibraryFilterDrawer>

      {onToggleSelectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isSelectionMode ? "accent" : "outline"}
              className="shrink-0 min-h-11 px-2.5 rounded-xl border-dashed"
              aria-label="Opsi lainnya"
            >
              <DotsThreeVertical size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onToggleSelectionMode} className="flex items-center gap-2">
              <CheckCircle size={16} weight={isSelectionMode ? "fill" : "bold"} />
              <span>{isSelectionMode ? "Batal Pilih" : "Pilih Komik (Batch)"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
