"use client";

import * as React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { DotsThreeVertical, CheckCircle, Plus } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface CollectionToolbarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  sortBy: "updatedAt" | "title";
  onSortChange: (v: "updatedAt" | "title") => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  totalCount: number;
  onCreateCollectionClick?: () => void;
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
  onCreateCollectionClick,
}: CollectionToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        onClear={onSearchClear}
        placeholder="Cari di koleksi..."
        containerClassName="sm:flex-1 min-w-0 h-[44px]"
      />

      <div className="flex items-center gap-2">
        <CustomSelect
          value={sortBy}
          onChange={(v) => onSortChange(v as "updatedAt" | "title")}
          options={[
            { value: "updatedAt", label: "Terakhir Diupdate" },
            { value: "title", label: "Abjad (A-Z)" },
          ]}
          align="right"
          className="flex-1 min-w-0"
        />

        {totalCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isSelectionMode ? "accent" : "outline"}
                className="h-[44px] px-2.5 rounded-xl font-bold gap-1.5 shrink-0 border-dashed"
                aria-label="Opsi lainnya"
              >
                <DotsThreeVertical size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onCreateCollectionClick && (
                <DropdownMenuItem onClick={onCreateCollectionClick} className="flex items-center gap-2">
                  <Plus size={16} weight="bold" />
                  <span>Buat Koleksi Baru</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onToggleSelectionMode} className="flex items-center gap-2">
                <CheckCircle size={16} weight={isSelectionMode ? "fill" : "bold"} />
                <span>{isSelectionMode ? "Batal Pilih" : "Pilih Komik (Batch)"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

    </div>
  );
}
