"use client";

import * as React from "react";
import { MangaItem } from "@/shared/sources/source-types";
import { LeaderboardRow } from "@/components/manga/card";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

interface HomeRankSliderProps {
  unifiedPopular: (MangaItem & { sourceId: string })[];
}

export function HomeRankSlider({ unifiedPopular }: HomeRankSliderProps) {
  // Group by sourceId
  const groupedBySource = React.useMemo(() => {
    const groups: Record<string, (MangaItem & { sourceId: string })[]> = {};
    unifiedPopular.forEach(item => {
      if (!groups[item.sourceId]) {
        groups[item.sourceId] = [];
      }
      if (groups[item.sourceId].length < 5) {
        groups[item.sourceId].push(item);
      }
    });
    return groups;
  }, [unifiedPopular]);

  const sourceIds = Object.keys(groupedBySource);
  const [activeSourceId, setActiveSourceId] = React.useState<string>(sourceIds[0] || "");

  React.useEffect(() => {
    if (sourceIds.length > 0 && !sourceIds.includes(activeSourceId)) {
      setActiveSourceId(sourceIds[0]);
    }
  }, [sourceIds, activeSourceId]);

  if (sourceIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Source Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x px-1">
        {sourceIds.map(sourceId => {
          const source = dynamicSourceRegistry.get(sourceId);
          const name = source?.name || sourceId;
          const isActive = sourceId === activeSourceId;
          
          return (
            <button
              key={sourceId}
              onClick={() => setActiveSourceId(sourceId)}
              className={`shrink-0 snap-start px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                isActive 
                  ? "bg-text-primary text-surface-base border-transparent" 
                  : "bg-surface-raised text-text-muted border-border-subtle hover:bg-surface-hover"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Leaderboard container */}
      <div className="bg-gradient-to-bl from-accent/5 to-accent/10 dark:from-surface-base dark:to-surface-overlay rounded-[2rem] p-5 sm:p-6 border border-transparent dark:border-border-subtle flex flex-col gap-1 overflow-hidden shadow-sm flex-1">
        {groupedBySource[activeSourceId]?.map((manga, idx) => (
          <LeaderboardRow 
            key={`${manga.sourceId}-${manga.id}`} 
            manga={{...manga, rank: idx + 1}} 
            sourceId={manga.sourceId} 
          />
        ))}
      </div>
    </div>
  );
}
