"use client";

import * as React from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-text-muted px-0.5">
        <span className="font-semibold text-text-secondary">Pencarian Multi-Sumber:</span>
        <span>{activeSelectedSources.length} dari {searchableSources.length} sumber aktif dicari</span>
      </div>
      <div className="flex overflow-x-auto [scrollbar-width:none] snap-x pb-1 gap-2 md:flex-wrap md:overflow-visible md:snap-none">
        {searchableSources.map((source) => {
          const isSelected = activeSelectedSources.includes(source.id);
          const isOffline = source.status === "unavailable" || source.status === "in-fix";
          return (
            <button
              key={source.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Sumber ${source.name}`}
              onClick={() => onToggleSource(source.id)}
              className={cn(
                "relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all outline-none border min-h-[36px] shadow-xs active:scale-[0.98]",
                isSelected
                  ? "border-accent/40 bg-accent/15 text-accent shadow-xs"
                  : "border-border-subtle bg-surface-raised/60 text-text-secondary hover:border-border-strong hover:text-text-primary"
              )}
            >
              {isSelected && <CheckCircle weight="fill" size={15} className="shrink-0" />}
              <span>{source.name}</span>
              {isOffline && (
                <span className="text-[10px] font-semibold text-semantic-warning bg-semantic-warning/15 px-1.5 py-0.5 rounded-md border border-semantic-warning/30 shrink-0">
                  !
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
