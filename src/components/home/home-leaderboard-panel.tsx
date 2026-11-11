"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { LeaderboardRow } from "@/components/komik/card/leaderboard-row";
import { CustomSelect } from "@/components/ui/custom-select";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import { cn } from "@/shared/utils/cn";
import type { HomeFeedManga } from "./home-feed-selection";

export interface HomeLeaderboardPanelProps {
  items: HomeFeedManga[];
  title?: string;
  defaultSourceId?: string;
  onSourceChange?: (sourceId: string) => void;
  seeAllHref?: string;
  className?: string;
}

export function HomeLeaderboardPanel({
  items,
  title = "Populer di sumber",
  defaultSourceId,
  onSourceChange,
  seeAllHref,
  className,
}: HomeLeaderboardPanelProps) {
  const preferencesStore = useSourcePreferencesStore();
  const isSourceDisabled = typeof preferencesStore?.isSourceDisabled === "function"
    ? preferencesStore.isSourceDisabled
    : () => false;

  const availableSources = React.useMemo(() => {
    const sources = new Map<string, string>();

    for (const item of items) {
      if (isSourceDisabled(item.sourceId)) continue;
      if (!sources.has(item.sourceId)) {
        sources.set(item.sourceId, item.sourceName);
      }
    }

    return Array.from(sources, ([id, name]) => ({ id, name }));
  }, [items, isSourceDisabled]);

  const [selectedSource, setSelectedSource] = React.useState<string | undefined>(
    defaultSourceId
  );

  const activeSourceId = React.useMemo(() => {
    const availableIds = new Set(availableSources.map((source) => source.id));

    if (selectedSource && availableIds.has(selectedSource)) {
      return selectedSource;
    }

    if (defaultSourceId && availableIds.has(defaultSourceId)) {
      return defaultSourceId;
    }

    return availableSources[0]?.id;
  }, [selectedSource, availableSources, defaultSourceId]);

  const activeSourceName =
    availableSources.find((source) => source.id === activeSourceId)?.name ?? "Sumber";

  const displayItems = React.useMemo(() => {
    if (!activeSourceId) return [];

    const seen = new Set<string>();
    const result: HomeFeedManga[] = [];

    for (const item of items) {
      if (item.sourceId !== activeSourceId) continue;
      const norm = normalizeTitle(item.title);
      const key = norm || item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= 5) break;
    }

    return result;
  }, [items, activeSourceId]);

  const targetSeeAllHref = activeSourceId
    ? `/sources/${activeSourceId}?sort=popular`
    : seeAllHref ?? "/popular";

  return (
    <section
      aria-label={title}
      className={cn(
        "relative flex h-full min-w-0 flex-col p-4 sm:p-5 lg:h-[340px] lg:p-4 rounded-xl border border-border-subtle bg-surface-raised shadow-xs overflow-hidden",
        className
      )}
    >
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-border-subtle/60 pb-2.5">
        <h3 className="min-w-0 truncate text-sm font-bold tracking-tight text-text-primary">
          {title}
        </h3>

        <div className="flex shrink-0 items-center gap-2">
          {availableSources.length > 1 && activeSourceId ? (
            <CustomSelect
              value={activeSourceId}
              onChange={(value) => {
                setSelectedSource(value);
                onSourceChange?.(value);
              }}
              label="Pilih sumber peringkat"
              options={availableSources.map((source) => ({
                value: source.id,
                label: source.name,
              }))}
              buttonClassName="min-h-11 max-w-[132px] rounded-sm border-border-subtle bg-surface-muted px-2.5 py-0 text-2xs font-semibold text-text-secondary shadow-none hover:bg-surface-hover"
              align="right"
            />
          ) : activeSourceId ? (
            <span className="max-w-[120px] truncate text-2xs font-semibold text-text-muted">
              {activeSourceName}
            </span>
          ) : null}

          {activeSourceId && (
            <Link
              href={targetSeeAllHref}
              className="group inline-flex min-h-11 items-center gap-1 rounded-sm px-1.5 text-xs font-bold text-accent hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="sr-only sm:not-sr-only">Lihat semua</span>
              <ArrowRight
                size={13}
                weight="regular"
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      </div>

      {displayItems.length > 0 ? (
        <div className="flex flex-1 flex-col divide-y divide-border-subtle/50 pb-1">
          {displayItems.map((manga, index) => {
            const rank = index + 1;

            return (
              <LeaderboardRow
                key={`${manga.sourceId}-${manga.id}-${rank}`}
                manga={{ ...manga, rank }}
                sourceId={manga.sourceId}
                density="home"
                emphasized={rank === 1}
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
