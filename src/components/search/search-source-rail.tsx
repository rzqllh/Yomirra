"use client";

import * as React from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { FilterChip } from "@/components/ui/filter-chip";
import type { SourceMetadata } from "@/shared/sources/source-types";

export interface SearchSourceRailProps {
  searchableSources: SourceMetadata[];
  activeSelectedSources: string[];
  onToggleSource: (id: string) => void;
}

export function SearchSourceRail({
  searchableSources,
  activeSelectedSources,
  onToggleSource,
}: SearchSourceRailProps) {
  if (searchableSources.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-1 text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">Cari dari</span>
        <span>{activeSelectedSources.length} dari {searchableSources.length} sumber dipilih</span>
      </div>
      <div className="flex overflow-x-auto [scrollbar-width:none] snap-x pb-1 gap-2 md:flex-wrap md:overflow-visible md:snap-none">
        {searchableSources.map((source) => {
          const isSelected = activeSelectedSources.includes(source.id);
          const isOffline = source.status === "unavailable" || source.status === "in-fix";
          return (
            <FilterChip
              key={source.id}
              type="button"
              aria-label={`${source.name}${isOffline ? ", sedang bermasalah" : ""}`}
              onClick={() => onToggleSource(source.id)}
              selected={isSelected}
              variant={isSelected ? "accent-subtle" : "default"}
              className="snap-start text-sm"
              label={
                <>
                  {isSelected && <CheckCircle weight="fill" size={18} aria-hidden="true" />}
                  <span>{source.name}</span>
                  {isOffline && <span className="rounded-[8px] bg-status-warning-bg px-2 py-1 text-xs font-semibold text-status-warning-fg">Gangguan</span>}
                </>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
