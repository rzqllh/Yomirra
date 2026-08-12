"use client";

import * as React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "@phosphor-icons/react";

export interface CollectionToolbarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  sortBy: "updatedAt" | "title";
  onSortChange: (v: "updatedAt" | "title") => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  totalCount: number;
}

export function CollectionToolbar({
  searchQuery,
  onSearchChange,
  onSearchClear,
  sortBy,
  onSortChange,
  isSelectionMode,
  onToggleSelectionMode,
  totalCount,
}: CollectionToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        onClear={onSearchClear}
        placeholder="Cari di koleksi..."
        containerClassName="flex-1 min-w-0 h-[44px]"
      />

      <div className="flex items-center gap-2 shrink-0">
        <CustomSelect
          value={sortBy}
          onChange={(v) => onSortChange(v as "updatedAt" | "title")}
          options={[
            { value: "updatedAt", label: "Terakhir Diupdate" },
            { value: "title", label: "Abjad (A-Z)" },
          ]}
          align="right"
          className="shrink-0"
        />

        {totalCount > 0 && (
          <Button
            variant={isSelectionMode ? "accent" : "outline"}
            onClick={onToggleSelectionMode}
            className="h-[44px] px-4 rounded-2xl font-bold gap-1.5 shrink-0"
          >
            <CheckCircle size={18} weight={isSelectionMode ? "fill" : "bold"} />
            <span className="hidden sm:inline">Pilih</span>
          </Button>
        )}
      </div>
    </div>
  );
}
