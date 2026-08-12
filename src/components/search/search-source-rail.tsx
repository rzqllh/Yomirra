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
    <div className="flex overflow-x-auto [scrollbar-width:none] snap-x px-4 -mx-4 pb-1 gap-2.5">
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
              "relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all outline-none border min-h-[44px]",
              isSelected
                ? "border-accent bg-accent/10 text-accent shadow-xs"
                : "border-border-subtle bg-surface-raised/40 text-text-secondary hover:border-border-strong hover:text-text-primary"
            )}
          >
            {isSelected && <CheckCircle weight="fill" size={15} className="shrink-0" />}
            <span>{source.name}</span>
            {isOffline && (
              <span className="text-[10px] font-semibold text-semantic-warning bg-semantic-warning/15 px-1.5 py-0.5 rounded-full border border-semantic-warning/30 shrink-0">
                !
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
