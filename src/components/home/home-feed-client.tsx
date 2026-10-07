"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
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
import { HomeHero } from "./home-hero";
import {
  selectHeroCandidates,
  selectSpotlightItems,
  type HomeFeedManga,
} from "./home-feed-selection";
import { ShelfCard } from "@/components/komik/card";
import { CompactCard } from "@/components/komik/card/compact-card";
import { ViewModeToggle } from "@/components/komik/view-mode-toggle";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

export interface HomeFeedClientProps {
  unifiedPopular: HomeFeedManga[];
  unifiedLatest: HomeFeedManga[];
}

export const SPOTLIGHT_AUTOPLAY_MS = 6_000;
const SWIPE_THRESHOLD_PX = 40;

export function HomeFeedClient({
  unifiedPopular,
  unifiedLatest,
}: HomeFeedClientProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  const getContinueReading = useHistoryStore((state) => state.getContinueReading);
  const rawHistoryItems = isMounted ? getContinueReading(50) : [];

  const { isSourceDisabled } = useSourcePreferencesStore();
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const listingViewMode = useSettingsStore((state) => state.listingViewMode);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();
  const readingStatusByManga = useCollectionStore(
    (state) => state.readingStatusByManga
  );
  const reducedMotion = useReducedMotion();

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const historyItems = React.useMemo(() => {
    let result = rawHistoryItems.filter((item) => {
      const mangaKey = `${item.sourceId}::${item.mangaId}` as MangaKey;
      if (readingStatusByManga[mangaKey] === "completed") return false;
      if (isSourceDisabled(item.sourceId)) return false;

      const source = dynamicSourceRegistry.get(item.sourceId);
      if (source?.status === "unavailable") return false;
      return true;
    });

    if (hideNsfw) {
      if (nsfwStatus !== "KNOWN") {
        result = [];
      } else {
        result = result.filter(
          (item) => !isFromNsfwSource(item.sourceId, item.isNsfw)
        );
      }
    }

    return result.slice(0, 10);
  }, [
    rawHistoryItems,
    readingStatusByManga,
    isSourceDisabled,
    hideNsfw,
    nsfwStatus,
    isFromNsfwSource,
  ]);

  const personalizedIds = React.useMemo(() => {
    const ids = new Set<string>();
    historyItems.forEach((item) =>
      ids.add(`${item.sourceId}-${item.mangaId}`)
    );
    return ids;
  }, [historyItems]);

  const filteredPopular = React.useMemo(() => {
    if (!hideNsfw) return unifiedPopular;
    if (nsfwStatus !== "KNOWN") return [];

    return unifiedPopular.filter(
      (manga) => !isFromNsfwSource(manga.sourceId)
    );
  }, [
    unifiedPopular,
    hideNsfw,
    nsfwStatus,
    isFromNsfwSource,
  ]);

  const filteredLatest = React.useMemo(() => {
    if (!hideNsfw) return unifiedLatest;
    if (nsfwStatus !== "KNOWN") return [];

    return unifiedLatest.filter(
      (manga) => !isFromNsfwSource(manga.sourceId)
    );
  }, [
    unifiedLatest,
    hideNsfw,
    nsfwStatus,
    isFromNsfwSource,
  ]);

  const discoveryItems =
    filteredLatest.length > 0 ? filteredLatest : filteredPopular;

  const spotlightItems = React.useMemo(
    () => selectSpotlightItems(discoveryItems, 5),
    [discoveryItems]
  );

  const heroCandidates = React.useMemo(
    () =>
      selectHeroCandidates(discoveryItems, spotlightItems, 15).map((item) => ({
        coverUrl: item.coverUrl,
        title: item.title,
      })),
    [discoveryItems, spotlightItems]
  );

  const [spotlightIndex, setSpotlightIndex] = React.useState(0);
  const [spotlightDirection, setSpotlightDirection] = React.useState<1 | -1>(1);
  const [isHoveringSpotlight, setIsHoveringSpotlight] = React.useState(false);
  const [isFocusInsideSpotlight, setIsFocusInsideSpotlight] = React.useState(false);
  const [isTouchingSpotlight, setIsTouchingSpotlight] = React.useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  const totalSpotlights = spotlightItems.length;

  React.useEffect(() => {
    if (spotlightIndex < totalSpotlights) return;
    setSpotlightIndex(totalSpotlights > 0 ? totalSpotlights - 1 : 0);
  }, [spotlightIndex, totalSpotlights]);

  React.useEffect(() => {
    const handleVisibilityChange = () => setIsDocumentHidden(document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const moveSpotlight = React.useCallback(
    (direction: 1 | -1) => {
      if (totalSpotlights <= 1) return;

      setSpotlightDirection(direction);
      setSpotlightIndex((current) =>
        direction === 1
          ? (current + 1) % totalSpotlights
          : (current - 1 + totalSpotlights) % totalSpotlights
      );
    },
    [totalSpotlights]
  );

  const isAutoplayPaused =
    isHoveringSpotlight ||
    isFocusInsideSpotlight ||
    isTouchingSpotlight ||
    isDocumentHidden;

  React.useEffect(() => {
    if (
      reducedMotion ||
      isAutoplayPaused ||
      totalSpotlights <= 1
    ) {
      return;
    }

    const timeout = window.setTimeout(
      () => moveSpotlight(1),
      SPOTLIGHT_AUTOPLAY_MS
    );

    return () => window.clearTimeout(timeout);
  }, [
    reducedMotion,
    isAutoplayPaused,
    totalSpotlights,
    spotlightIndex,
    moveSpotlight,
  ]);

  const currentSpotlight =
    spotlightItems[spotlightIndex] ?? spotlightItems[0];

  const updateHariIni = React.useMemo(
    () =>
      filteredLatest
        .filter(
          (item) =>
            !personalizedIds.has(`${item.sourceId}-${item.id}`)
        )
        .slice(0, 18),
    [filteredLatest, personalizedIds]
  );

  return (
    <div>
      <section id="hero-section" aria-label="Pembuka Beranda">
        <HomeHero candidates={heroCandidates} />
      </section>

      <section
        id="spotlight-section"
        aria-labelledby="spotlight-title"
        className="mt-8 flex min-w-0 flex-col gap-3.5 sm:gap-4"
      >
        <div className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full bg-accent"
            aria-hidden="true"
          />
          <h2
            id="spotlight-title"
            className="text-lg font-bold tracking-tight text-text-primary sm:text-xl"
          >
            Sorotan &amp; peringkat
          </h2>
        </div>

        <div className="grid min-w-0 items-stretch gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.38fr)_minmax(290px,0.82fr)]">
          <div
            data-testid="spotlight-carousel"
            className="min-w-0"
            onMouseEnter={() => setIsHoveringSpotlight(true)}
            onMouseLeave={() => setIsHoveringSpotlight(false)}
            onFocusCapture={() => setIsFocusInsideSpotlight(true)}
            onBlurCapture={(event) => {
              const nextTarget = event.relatedTarget;
              if (
                !(nextTarget instanceof Node) ||
                !event.currentTarget.contains(nextTarget)
              ) {
                setIsFocusInsideSpotlight(false);
              }
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
              setIsTouchingSpotlight(true);
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              touchStartX.current = null;
              setIsTouchingSpotlight(false);

              if (startX === null || endX === undefined) return;
              const delta = startX - endX;

              if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
              moveSpotlight(delta > 0 ? 1 : -1);
            }}
            onTouchCancel={() => {
              touchStartX.current = null;
              setIsTouchingSpotlight(false);
            }}
          >
            {currentSpotlight ? (
              <EditorialSpotlight
                manga={currentSpotlight}
                sourceId={currentSpotlight.sourceId}
                sourceName={currentSpotlight.sourceName}
                direction={spotlightDirection}
                currentIndex={spotlightIndex}
                totalCount={totalSpotlights}
                onNext={() => moveSpotlight(1)}
                onPrev={() => moveSpotlight(-1)}
              />
            ) : (
              <div
                className="ink-panel h-[268px] sm:h-[310px] lg:h-[340px]"
                aria-hidden="true"
              />
            )}
          </div>

          <HomeLeaderboardPanel items={filteredPopular} />
        </div>
      </section>

      <section
        id="continue-reading-section"
        className="mt-11 flex flex-col sm:mt-12"
      >
        <ContinueReadingList items={historyItems} />
      </section>

      {updateHariIni.length > 0 && (
        <section
          id="recently-updated-section"
          aria-labelledby="recently-updated-title"
          className="mt-10 flex flex-col gap-3.5 sm:mt-11"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="recently-updated-title"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-text-primary sm:text-xl"
            >
              <span
                className="size-2 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span>Baru diperbarui</span>
            </h2>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <ViewModeToggle />
              <Link
                href="/library"
                className="group inline-flex min-h-11 items-center gap-1 rounded-[10px] px-1.5 text-xs font-bold text-accent hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-accent"
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
          </div>

          {listingViewMode === "compact" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="scrollbar-hide flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4 md:grid md:grid-cols-3 md:gap-x-4 md:gap-y-6 md:overflow-visible md:snap-none lg:grid-cols-4 xl:grid-cols-5 md:[&>*:nth-child(n+11)]:hidden">
              {updateHariIni.map((manga) => (
                <div
                  key={`${manga.sourceId}-${manga.id}`}
                  className="w-[140px] shrink-0 snap-start sm:w-[155px] md:w-auto md:min-w-0"
                >
                  <ShelfCard
                    manga={manga}
                    sourceId={manga.sourceId}
                    showSourceBadge
                  />
                </div>
              ))}
              <div className="flex aspect-[3/4] w-[140px] shrink-0 snap-start items-center justify-center p-2 sm:w-[155px] md:hidden">
                <Link
                  href="/library"
                  className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-default font-bold text-text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
                >
                  <MagnifyingGlass size={24} aria-hidden="true" />
                  <span className="text-sm">Lihat semua</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
