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
import { Sparkle, MagicWand, MagnifyingGlass, TrendUp } from "@phosphor-icons/react";
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
  const nsfwSourceIds = useNsfwSourceIds();

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
      result = result.filter(item => !isFromNsfwSource(item.sourceId, item.isNsfw));
    }
    return result.slice(0, 10);
  }, [rawHistoryItems, isSourceDisabled, hideNsfw, isFromNsfwSource]);

  const personalizedIds = new Set<string>();
  historyItems.forEach(item => personalizedIds.add(`${item.sourceId}-${item.mangaId}`));

  // Sources that are active and not hidden from home
  const sourcesToShow = React.useMemo(() => {
    const activeSources = Array.from(new Set(unifiedPopular.map(m => m.sourceId)));
    return activeSources.filter(id => !isSourceHiddenFromHome(id));
  }, [unifiedPopular, isSourceHiddenFromHome]);

  const [activeSourceId, setActiveSourceId] = React.useState<string>("");

  React.useEffect(() => {
    if (sourcesToShow.length > 0 && !sourcesToShow.includes(activeSourceId)) {
      setActiveSourceId(sourcesToShow[0]);
    }
  }, [sourcesToShow, activeSourceId]);

  // Grouped by Source
  const sourceData = React.useMemo(() => {
    const data: Record<string, { popular: typeof unifiedPopular, latest: typeof unifiedLatest }> = {};
    sourcesToShow.forEach(sourceId => {
      data[sourceId] = {
        popular: unifiedPopular.filter(m => m.sourceId === sourceId).slice(0, 10),
        latest: unifiedLatest.filter(m => m.sourceId === sourceId).slice(0, 10),
      };
    });
    return data;
  }, [sourcesToShow, unifiedPopular, unifiedLatest]);

  const activeSourcePopular = sourceData[activeSourceId]?.popular.slice(0, 5) || [];
  const activeSourceHighlight = sourceData[activeSourceId]?.latest.slice(0, 10) || [];

  // Used to prevent Sorotan items from appearing in general Latest
  const highlightIds = new Set(activeSourceHighlight.map(item => `${item.sourceId}-${item.id}`));

  // Update Hari Ini (Top 20 Latest interleaved)
  const updateHariIni = React.useMemo(() => {
    return unifiedLatest.filter(item => {
      const id = `${item.sourceId}-${item.id}`;
      return !personalizedIds.has(id);
    }).slice(0, 20);
  }, [unifiedLatest, personalizedIds]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-10 md:gap-14 animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both pb-20">
      
      {/* 1. Lanjut Baca */}
      {historyItems.length > 0 && (
        <ContinueReadingList items={historyItems} />
      )}

      {/* 2. Desktop Grid: Highlight & Rank with Global Tabs */}
      {(sourcesToShow.length > 0) && (
        <div className="flex flex-col gap-4 px-2">
          
          {/* Global Tabs for Grid */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {sourcesToShow.map(sourceId => {
              const source = dynamicSourceRegistry.get(sourceId);
              const name = source?.name || sourceId;
              const isActive = sourceId === activeSourceId;
              
              return (
                <button
                  key={sourceId}
                  onClick={() => setActiveSourceId(sourceId)}
                  className={cn(
                    "shrink-0 snap-start px-5 py-2 rounded-full text-sm font-bold transition-all border",
                    isActive 
                      ? "bg-text-primary text-surface-base border-transparent shadow-sm" 
                      : "bg-surface-raised text-text-muted border-border-subtle hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
            {/* Kiri: Sorotan Utama */}
            <div className="flex flex-col gap-4 w-full min-w-0">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                <Sparkle weight="duotone" className="text-semantic-info" /> Sorotan Utama
              </h2>
              {/* Force fixed height to prevent jumping */}
              <div className="h-[320px] sm:h-[400px] xl:h-[480px] relative w-full overflow-hidden rounded-[2rem] xl:rounded-[3rem]">
                {activeSourceHighlight.length > 0 ? (
                  <FeaturedHeroCarousel sourceId={activeSourceId} mangas={activeSourceHighlight} />
                ) : (
                  <div className="w-full h-full bg-surface-raised animate-pulse rounded-[2rem] xl:rounded-[3rem]"></div>
                )}
              </div>
            </div>

            {/* Kanan: Rank */}
            <div className="flex flex-col gap-4 w-full min-w-0">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                <TrendUp weight="duotone" className="text-accent" /> Peringkat Populer
              </h2>
              {/* Force fixed height to prevent jumping, use flex and justify-between for even spacing */}
              <div className="h-[320px] sm:h-[400px] xl:h-[480px] bg-gradient-to-bl from-accent/5 to-accent/10 dark:from-surface-base dark:to-surface-overlay rounded-[2rem] p-5 sm:p-6 border border-transparent dark:border-border-subtle flex flex-col gap-2 overflow-hidden shadow-sm">
                {activeSourcePopular.map((manga, idx) => (
                  <div key={`${manga.sourceId}-${manga.id}`} className="flex-1 flex flex-col justify-center min-h-0">
                    <LeaderboardRow 
                      manga={{...manga, rank: idx + 1}} 
                      sourceId={manga.sourceId} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Update Hari Ini */}
      {updateHariIni.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 px-2">
            <MagicWand weight="duotone" className="text-accent" /> Update Hari Ini
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-2">
            {updateHariIni.map((manga: any) => (
              <div key={`${manga.sourceId}-${manga.id}`} className="shrink-0 snap-start w-[140px] sm:w-[160px]">
                <ShelfCard manga={manga} sourceId={manga.sourceId} showSourceBadge />
              </div>
            ))}
            
            {/* Lihat Semua Card */}
            <div className="shrink-0 snap-start w-[140px] sm:w-[160px] flex items-center justify-center p-4">
              <Link 
                href="/library"
                className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border-default hover:border-accent hover:bg-accent/5 text-text-muted hover:text-accent transition-colors flex flex-col items-center justify-center gap-2 font-bold"
              >
                <MagnifyingGlass size={24} />
                <span className="text-sm">Lihat Semua</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Per Source Popular & Latest */}
      {sourcesToShow.map(sourceId => {
        const source = dynamicSourceRegistry.get(sourceId);
        const sourceName = source?.name || sourceId;
        const data = sourceData[sourceId];
        
        if (!data || (data.popular.length === 0 && data.latest.length === 0)) return null;

        return (
          <div key={sourceId} className="flex flex-col gap-8 pt-6 border-t border-border-subtle/50 px-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">{sourceName}</h2>
              <Link href={`/sources/${sourceId}`} className="text-sm font-bold text-accent hover:underline">
                Lihat Semua
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Popular */}
              {data.popular.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-text-muted">
                    <TrendUp weight="bold" /> Populer
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {data.popular.map(manga => (
                      <div key={manga.id} className="shrink-0 snap-start w-[130px] sm:w-[150px]">
                        <ShelfCard manga={manga} sourceId={sourceId} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest */}
              {data.latest.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-text-muted">
                    <MagicWand weight="bold" /> Terbaru
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {data.latest.map(manga => (
                      <div key={manga.id} className="shrink-0 snap-start w-[130px] sm:w-[150px]">
                        <ShelfCard manga={manga} sourceId={sourceId} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
}
