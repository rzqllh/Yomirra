"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { LeaderboardRow } from "@/components/manga/card/leaderboard-row";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/shared/utils/cn";
import type { MangaItem } from "@/shared/sources/source-types";

export interface HomeLeaderboardPanelProps {
  items: (MangaItem & { sourceId?: string })[];
  title?: string;
  defaultSourceId?: string;
  onSourceChange?: (sourceId: string) => void;
  seeAllHref?: string;
  className?: string;
}

/**
 * Editorial Leaderboard panel showcasing top-ranked manga.
 * Source-aware: filters rankings strictly by active source (01-05).
 */
export function HomeLeaderboardPanel({
  items,
  title = "Paling banyak dibaca",
  defaultSourceId,
  onSourceChange,
  seeAllHref,
  className,
}: HomeLeaderboardPanelProps) {
  // Extract unique available sources from the items
  const availableSources = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((m) => {
      if (m.sourceId) set.add(m.sourceId);
    });
    return Array.from(set);
  }, [items]);

  const [selectedSource, setSelectedSource] = React.useState<string | undefined>(defaultSourceId);

  // Compute active source ID
  const activeSourceId = React.useMemo(() => {
    if (selectedSource && (availableSources.includes(selectedSource) || availableSources.length === 0)) {
      return selectedSource;
    }
    if (availableSources.includes("shinigami")) return "shinigami";
    return availableSources[0] || defaultSourceId || "shinigami";
  }, [selectedSource, availableSources, defaultSourceId]);

  // Filter items strictly by active source
  const displayItems = React.useMemo(() => {
    return items
      .filter((m) => (m.sourceId || "shinigami") === activeSourceId)
      .slice(0, 5);
  }, [items, activeSourceId]);

  const targetSeeAllHref = seeAllHref || (activeSourceId ? `/sources/${activeSourceId}?sort=popular` : "/popular");

  return (
    <section
      aria-label={title}
      className={cn(
        "ink-panel flex h-full min-w-0 flex-col p-4 sm:p-5 lg:p-6",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-1 border-b border-border-subtle/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="text-sm font-bold text-text-primary tracking-tight truncate">
            {title}
          </h3>

          {/* Compact Source Selector */}
          {availableSources.length > 1 ? (
            <CustomSelect
              value={activeSourceId}
              onChange={(value) => {
                setSelectedSource(value);
                onSourceChange?.(value);
              }}
              label="Pilih sumber peringkat"
              options={availableSources.map((sId) => ({
                value: sId,
                label: <span className="capitalize">{sId}</span>,
              }))}
              buttonClassName="min-h-0 h-6 px-2 py-0 text-[11px] font-bold uppercase tracking-wider text-text-secondary bg-surface-muted hover:bg-surface-hover hover:text-text-primary border border-border-subtle rounded-xs gap-1.5 focus-visible:ring-1 focus-visible:ring-accent transition-colors"
              align="left"
            />
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-muted/60 border border-border-subtle/60 rounded-xs px-1.5 py-0.5 shrink-0">
              {activeSourceId}
            </span>
          )}
        </div>

        <Link
          href={targetSeeAllHref}
          className="group inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent rounded shrink-0"
        >
          <span>Lihat semua</span>
          <ArrowRight
            size={13}
            weight="bold"
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Rows Container */}
      {displayItems.length > 0 ? (
        <div className="flex flex-1 flex-col justify-between divide-y divide-border-subtle/50">
          {displayItems.map((manga, idx) => {
            const rank = idx + 1;
            const sourceId = manga.sourceId || activeSourceId;

            return (
              <LeaderboardRow
                key={`${sourceId}-${manga.id}-${rank}`}
                manga={{ ...manga, rank }}
                sourceId={sourceId}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center py-8 text-center">
          <p className="text-xs text-text-muted">
            Belum ada peringkat dari sumber ini.
          </p>
        </div>
      )}
    </section>
  );
}
