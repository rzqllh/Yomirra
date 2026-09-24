"use client";

import * as React from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { FilterChip } from "@/components/ui/filter-chip";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";

export interface LibraryStatusRailProps {
  sort: string;
  onTabChange: (newSort: string) => void;
  dynamicSorts: { id: string; name: string }[];
  selectedFormats: string[];
  onPageReset: () => void;
}

const FORMAT_OPTIONS = [
  { id: "", label: "Semua Format" },
  { id: "manhwa", label: "Manhwa" },
  { id: "manga", label: "Manga" },
  { id: "manhua", label: "Manhua" },
];

export function LibraryStatusRail({
  sort,
  onTabChange,
  dynamicSorts,
  selectedFormats,
  onPageReset,
}: LibraryStatusRailProps) {
  const filterStore = useLibraryFilterStore();

  return (
    <div className="flex items-center gap-2 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="shrink-0 flex items-center">
        <CustomSelect
          value={sort}
          onChange={(v) => onTabChange(v)}
          options={dynamicSorts.map(s => ({ value: s.id, label: s.name }))}
          align="left"
          className="shrink-0"
          label="Urutkan rak bacaan"
          buttonClassName="min-h-11 px-3 text-sm bg-surface-overlay"
        />
        <div className="w-px h-6 bg-border-subtle shrink-0 mx-1" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1 -mr-4 pr-4 md:mr-0 md:pr-0">
        {FORMAT_OPTIONS.map(fmt => {
          const isSelected =
            fmt.id === ""
              ? selectedFormats.length === 0
              : selectedFormats.includes(fmt.id);

          return (
            <FilterChip
              key={fmt.id}
              onClick={() => {
                onPageReset();
                if (fmt.id === "") {
                  filterStore.setFilters({ selectedFormats: [] });
                } else {
                  filterStore.setFilters({ selectedFormats: [fmt.id] });
                }
              }}
              selected={isSelected}
              variant={isSelected ? "accent-solid" : "default"}
              label={fmt.label}
              className="shrink-0 min-h-11 px-3 text-sm"
            />
          );
        })}
      </div>
    </div>
  );
}
