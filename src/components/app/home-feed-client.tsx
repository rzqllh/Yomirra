"use client";

import * as React from "react";
import { MangaItem } from "@/shared/sources/source-types";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

import { ContinueReadingList } from "./continue-reading-list";
import { FeaturedHeroCarousel } from "./featured-hero-carousel";
import { LeaderboardRow, ShelfCard } from "@/components/manga/card";
import { MagnifyingGlass, Fire, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";

interface HomeFeedClientProps {
  unifiedPopular: (MangaItem & { sourceId: string })[];
  unifiedLatest: (MangaItem & { sourceId: string })[];
}

export function HomeFeedClient({ unifiedPopular, unifiedLatest }: HomeFeedClientProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const rawHistoryItems = isMounted ? getContinueReading(50) : [];

  const { isSourceDisabled, isSourceHiddenFromHome } = useSourcePreferencesStore();
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const historyItems = React.useMemo(() => {
    let result = rawHistoryItems.filter(item => {
      if (isSourceDisabled(item.sourceId)) return false;
      const source = dynamicSourceRegistry.get(item.sourceId);
      if (source && source.status === "unavailable") return false;
      return true;
    });
    if (hideNsfw) {
      if (nsfwStatus !== "KNOWN") {
        result = [];
      } else {
        result = result.filter(item => !isFromNsfwSource(item.sourceId, item.isNsfw));
      }
    }
    return result.slice(0, 10);
  }, [rawHistoryItems, isSourceDisabled, hideNsfw, nsfwStatus, isFromNsfwSource]);

  const personalizedIds = new Set<string>();
  historyItems.forEach(item => personalizedIds.add(`${item.sourceId}-${item.mangaId}`));

  const filteredPopular = React.useMemo(() => {
    if (!hideNsfw) return unifiedPopular;
    if (nsfwStatus !== "KNOWN") return [];
    return unifiedPopular.filter(m => !isFromNsfwSource(m.sourceId));
  }, [unifiedPopular, hideNsfw, nsfwStatus, isFromNsfwSource]);

  const filteredLatest = React.useMemo(() => {
    if (!hideNsfw) return unifiedLatest;
    if (nsfwStatus !== "KNOWN") return [];
    return unifiedLatest.filter(m => !isFromNsfwSource(m.sourceId));
  }, [unifiedLatest, hideNsfw, nsfwStatus, isFromNsfwSource]);

  const sourcesToShow = React.useMemo(() => {
    const activeSources = Array.from(new Set(filteredPopular.map(m => m.sourceId)));
    return activeSources.filter(id => !isSourceHiddenFromHome(id));
  }, [filteredPopular, isSourceHiddenFromHome]);

  const [activeSourceId, setActiveSourceId] = React.useState<string>("");

  React.useEffect(() => {
    if (sourcesToShow.length > 0 && !sourcesToShow.includes(activeSourceId)) {
      setActiveSourceId(sourcesToShow[0]);
    }
  }, [sourcesToShow, activeSourceId]);

  const activeSourcePopular = React.useMemo(
    () => filteredPopular.filter(m => m.sourceId === activeSourceId).slice(0, 5),
    [filteredPopular, activeSourceId]
  );
  const activeSourceHighlight = React.useMemo(
    () => filteredLatest.filter(m => m.sourceId === activeSourceId).slice(0, 10),
    [filteredLatest, activeSourceId]
  );

  // Global feeds — all active sources combined, no chip filter
  const updateHariIni = React.useMemo(() => {
    return filteredLatest
      .filter(item => !personalizedIds.has(`${item.sourceId}-${item.id}`))
      .slice(0, 20);
  }, [filteredLatest, personalizedIds]);

  const popularKomik = React.useMemo(() => {
    return filteredPopular.slice(0, 20);
  }, [filteredPopular]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-8 md:gap-10 animate-in fade-in zoom-in-[0.98] duration-300 ease-out fill-mode-both pb-12">

      {historyItems.length > 0 && (
        <ContinueReadingList items={historyItems} variant="cyber-editorial" />
      )}

      {sourcesToShow.length > 0 && (
        <div className="flex flex-col gap-0 rounded-2xl md:rounded-3xl border border-border-subtle/60 bg-surface-glass/40 backdrop-blur-sm overflow-hidden">

          {/* Section header + source chips — inside the card */}
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
            <h2 className="text-sm font-bold text-text-secondary flex items-center gap-1.5 shrink-0">
              <Sparkle size={14} weight="fill" className="text-accent" />
              Sorotan &amp; Peringkat
            </h2>
            {/* Chips — right side, scoped filter */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {sourcesToShow.map(sourceId => {
                const name = dynamicSourceRegistry.get(sourceId)?.name || sourceId;
                const isActive = sourceId === activeSourceId;
                return (
                  <button
                    key={sourceId}
                    onClick={() => setActiveSourceId(sourceId)}
                    className={cn(
                      "shrink-0 min-h-[30px] px-3 py-1 rounded-xl text-[11px] font-bold transition-all duration-200 outline-none tap-highlight-transparent whitespace-nowrap active:scale-95 shadow-xs",
                      isActive
                        ? "bg-text-primary text-surface-base shadow-xs font-extrabold"
                        : "bg-surface-raised/80 text-text-muted border border-border-subtle/60 hover:text-text-primary"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-4 lg:p-4 lg:pt-0">
          {/* Hero Carousel */}
          <div className="h-[320px] sm:h-[420px] md:h-[360px] lg:h-[420px] xl:h-[460px] w-full min-w-0 overflow-hidden rounded-2xl md:rounded-3xl">
            {activeSourceHighlight.length > 0 ? (
              <FeaturedHeroCarousel sourceId={activeSourceId} mangas={activeSourceHighlight} variant="cyber-editorial" />
            ) : (
              <div className="w-full h-full bg-surface-raised animate-pulse" />
            )}
          </div>

          {/* Leaderboard strip */}
          {activeSourcePopular.length > 0 && (
            <div className="p-3 flex flex-col gap-0.5 border-t border-border-subtle/40 lg:border-t-0 lg:p-0 lg:h-[420px] xl:h-[460px] lg:overflow-y-auto">
              {activeSourcePopular.map((manga, idx) => (
                <LeaderboardRow
                  key={`${manga.sourceId}-${manga.id}`}
                  manga={{ ...manga, rank: idx + 1 }}
                  sourceId={manga.sourceId}
                  variant="cyber-editorial"
                />
              ))}
            </div>
          )}
          </div>
        </div>
      )}

      {updateHariIni.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">Update Hari Ini</h2>
            <Link href="/library" className="hidden md:inline text-xs font-bold text-accent hover:underline">Lihat Semua</Link>
          </div>
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
        </div>
      )}

      {popularKomik.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
              <Fire size={20} weight="fill" className="text-orange-500" />
              Popular Komik
            </h2>
            <Link href="/popular" className="text-xs font-bold text-accent hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide w-full md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:snap-none md:gap-x-4 md:gap-y-6 md:[&>*:nth-child(n+11)]:hidden">
            {popularKomik.map((manga) => (
              <div key={`${manga.sourceId}-${manga.id}`} className="shrink-0 snap-start w-[140px] sm:w-[155px] md:w-auto md:min-w-0">
                <ShelfCard manga={manga} sourceId={manga.sourceId} showSourceBadge />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
