"use client";

import * as React from "react";
import { MangaItem } from "@/shared/sources/source-types";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaKey } from "@/shared/types/collection";

import { ContinueReadingList } from "./continue-reading-list";
import { EditorialSpotlight } from "./editorial-spotlight";
import { HomeLeaderboardPanel } from "./home-leaderboard-panel";
import { ShelfCard } from "@/components/manga/card";
import { CompactCard } from "@/components/manga/card/compact-card";
import { ViewModeToggle } from "@/components/manga/view-mode-toggle";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";

export interface HomeFeedClientProps {
  unifiedPopular: (MangaItem & { sourceId: string })[];
  unifiedLatest: (MangaItem & { sourceId: string })[];
}

/**
 * Client coordinator for Yomirra editorial feed.
 * Manages carousel index state, source filtering, and shelf layout modes.
 */
export function HomeFeedClient({ unifiedPopular, unifiedLatest }: HomeFeedClientProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  const getContinueReading = useHistoryStore((state) => state.getContinueReading);
  const rawHistoryItems = isMounted ? getContinueReading(50) : [];

  const { isSourceDisabled } = useSourcePreferencesStore();
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const listingViewMode = useSettingsStore((state) => state.listingViewMode);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const readingStatusByManga = useCollectionStore((state) => state.readingStatusByManga);

  // History / Continue Reading items
  const historyItems = React.useMemo(() => {
    let result = rawHistoryItems.filter((item) => {
      const mangaKey = `${item.sourceId}::${item.mangaId}` as MangaKey;
      if (readingStatusByManga[mangaKey] === "completed") return false;
      if (isSourceDisabled(item.sourceId)) return false;
      const source = dynamicSourceRegistry.get(item.sourceId);
      if (source && source.status === "unavailable") return false;
      return true;
    });

    if (hideNsfw) {
      if (nsfwStatus !== "KNOWN") {
        result = [];
      } else {
        result = result.filter((item) => !isFromNsfwSource(item.sourceId, item.isNsfw));
      }
    }
    return result.slice(0, 10);
  }, [rawHistoryItems, readingStatusByManga, isSourceDisabled, hideNsfw, nsfwStatus, isFromNsfwSource]);

  const personalizedIds = new Set<string>();
  historyItems.forEach((item) => personalizedIds.add(`${item.sourceId}-${item.mangaId}`));

  // Filtered feeds
  const filteredPopular = React.useMemo(() => {
    if (!hideNsfw) return unifiedPopular;
    if (nsfwStatus !== "KNOWN") return [];
    return unifiedPopular.filter((m) => !isFromNsfwSource(m.sourceId));
  }, [unifiedPopular, hideNsfw, nsfwStatus, isFromNsfwSource]);

  const filteredLatest = React.useMemo(() => {
    if (!hideNsfw) return unifiedLatest;
    if (nsfwStatus !== "KNOWN") return [];
    return unifiedLatest.filter((m) => !isFromNsfwSource(m.sourceId));
  }, [unifiedLatest, hideNsfw, nsfwStatus, isFromNsfwSource]);

  // Unified Spotlight items (up to 5 items)
  const spotlightItems = React.useMemo(() => {
    const list = filteredLatest.length > 0 ? filteredLatest : filteredPopular;
    const candidates = list.filter((item) => Boolean(item.coverUrl && item.title));
    return candidates.slice(0, 5);
  }, [filteredLatest, filteredPopular]);

  // Spotlight carousel index state
  const [spotlightIndex, setSpotlightIndex] = React.useState(0);
  const totalSpotlights = spotlightItems.length;

  const handleNext = React.useCallback(() => {
    if (totalSpotlights <= 1) return;
    setSpotlightIndex((prev) => (prev + 1) % totalSpotlights);
  }, [totalSpotlights]);

  const handlePrev = React.useCallback(() => {
    if (totalSpotlights <= 1) return;
    setSpotlightIndex((prev) => (prev - 1 + totalSpotlights) % totalSpotlights);
  }, [totalSpotlights]);

  const currentSpotlight = spotlightItems[spotlightIndex] || spotlightItems[0];

  // Recently updated items (excluding continuing reading)
  const updateHariIni = React.useMemo(() => {
    return filteredLatest
      .filter((item) => !personalizedIds.has(`${item.sourceId}-${item.id}`))
      .slice(0, 18);
  }, [filteredLatest, personalizedIds]);


  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-9 sm:gap-11 pb-16">

      {/* SECTION 1: Spotlight Carousel & Leaderboard */}
      <section
        id="spotlight-section"
        aria-labelledby="spotlight-title"
        className="flex min-w-0 flex-col gap-4 sm:gap-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h1
            id="spotlight-title"
            className="ink-display text-[24px] sm:text-[30px] font-normal text-text-primary tracking-tight"
          >
            Sorotan &amp; peringkat
          </h1>
        </div>

        <div className="grid min-w-0 items-stretch gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.38fr)_minmax(290px,0.82fr)]">
          {/* Spotlight Hero Box */}
          <div className="min-w-0 h-full flex flex-col">
            {currentSpotlight ? (
              <EditorialSpotlight
                manga={currentSpotlight}
                sourceId={currentSpotlight.sourceId}
                currentIndex={spotlightIndex}
                totalCount={totalSpotlights}
                onNext={handleNext}
                onPrev={handlePrev}
                className="h-full"
              />
            ) : (
              <div className="ink-skeleton min-h-[300px] h-full w-full rounded-[18px]" aria-hidden="true" />
            )}
          </div>

          {/* Leaderboard Panel (Top 5) */}
          <div className="min-w-0 h-full flex flex-col">
            <HomeLeaderboardPanel items={filteredPopular} />
          </div>
        </div>
      </section>

      {/* SECTION 2: Lanjut Baca (Continue Reading) */}
      <section id="continue-reading-section" className="flex flex-col">
        <ContinueReadingList items={historyItems} />
      </section>

      {updateHariIni.length > 0 && (
        <section
          id="recently-updated-section"
          aria-labelledby="recently-updated-title"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="recently-updated-title"
              className="ink-display text-[22px] sm:text-[28px] font-normal text-text-primary flex items-center gap-2 tracking-tight"
            >
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span>Baru diperbarui</span>
            </h2>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <ViewModeToggle />
              <Link
                href="/library"
                className="group inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent rounded"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {listingViewMode === "compact" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {updateHariIni.slice(0, 12).map((manga) => (
                <CompactCard
                  key={`${manga.sourceId}-${manga.id}`}
                  manga={manga}
                  sourceId={manga.sourceId}
                  showSourceBadge
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide w-full md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:snap-none md:gap-x-4 md:gap-y-6 md:[&>*:nth-child(n+11)]:hidden">
              {updateHariIni.map((manga) => (
                <div key={`${manga.sourceId}-${manga.id}`} className="shrink-0 snap-start w-[140px] sm:w-[155px] md:w-auto md:min-w-0">
                  <ShelfCard manga={manga} sourceId={manga.sourceId} showSourceBadge />
                </div>
              ))}
              <div className="shrink-0 snap-start w-[140px] sm:w-[155px] md:hidden flex items-center justify-center p-2">
                <Link
                  href="/library"
                  className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border-default hover:border-accent hover:bg-accent/5 text-text-muted hover:text-accent transition-all flex flex-col items-center justify-center gap-2 font-bold"
                >
                  <MagnifyingGlass size={24} />
                  <span className="text-sm">Lihat Semua</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}


    </div>
  );
}
