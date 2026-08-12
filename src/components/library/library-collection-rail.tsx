"use client";

import * as React from "react";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/shared/utils/cn";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import type { Collection, MangaKey } from "@/shared/types/collection";
import type { LibraryItem } from "@/shared/store/library-store";

export interface LibraryCollectionRailProps {
  collections: Collection[];
  libraryItems: Record<string, LibraryItem>;
  membershipsByManga: Record<MangaKey, string[]>;
  activeSourceId: string;
  selectedCollections: string[];
  onPageReset: () => void;
}

export function LibraryCollectionRail({
  collections,
  libraryItems,
  membershipsByManga,
  activeSourceId,
  selectedCollections,
  onPageReset,
}: LibraryCollectionRailProps) {
  const filterStore = useLibraryFilterStore();

  if (collections.length === 0) return null;

  const sourceItems = Object.values(libraryItems).filter(item => item.sourceId === activeSourceId);
  const totalSemua = sourceItems.length;

  const getCollectionCount = (cId: string) => {
    return sourceItems.filter(item => {
      const key = `${item.sourceId}::${item.mangaId}` as MangaKey;
      const memberships = membershipsByManga[key] || [];
      return memberships.includes(cId);
    }).length;
  };

  return (
    <div className="mt-6 mb-2">
      <h3 className="text-xs font-black tracking-widest text-text-muted uppercase mb-3 px-1">
        Koleksi
      </h3>
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <FilterChip
          onClick={() => {
            onPageReset();
            filterStore.setFilters({ selectedCollections: [] });
          }}
          selected={selectedCollections.length === 0}
          variant={selectedCollections.length === 0 ? "accent-solid" : "default"}
          className="shrink-0 h-[36px] px-4 text-[13px]"
          label={
            <>
              Semua
              <span
                className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded-md ml-1.5",
                  selectedCollections.length === 0 ? "bg-white/20 text-white" : "bg-border-subtle/50 text-text-muted"
                )}
              >
                {totalSemua}
              </span>
            </>
          }
        />

        {collections.map(c => {
          const isSelected = selectedCollections.includes(c.id);
          const count = getCollectionCount(c.id);
          return (
            <FilterChip
              key={c.id}
              onClick={() => {
                onPageReset();
                filterStore.setFilters({ selectedCollections: [c.id] });
              }}
              selected={isSelected}
              variant={isSelected ? "accent-solid" : "default"}
              className="shrink-0 h-[36px] px-4 text-[13px]"
              label={
                <>
                  {c.name}
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.5 rounded-md ml-1.5",
                      isSelected ? "bg-white/20 text-white" : "bg-border-subtle/50 text-text-muted"
                    )}
                  >
                    {count}
                  </span>
                </>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
