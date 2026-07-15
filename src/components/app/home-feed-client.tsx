"use client";

import * as React from "react";
import { MangaItem } from "@/shared/sources/source-types";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

import { ContinueReadingList } from "./continue-reading-list";
import { FeaturedHeroCarousel } from "./featured-hero-carousel";
import { LeaderboardRow, ShelfCard } from "@/components/manga/card";
import { Fire, TrendUp, Sparkle, MagicWand, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";

interface HomeFeedClientProps {
  unifiedPopular: (MangaItem & { sourceId: string })[];
  unifiedLatest: (MangaItem & { sourceId: string })[];
}

export function HomeFeedClient({ unifiedPopular, unifiedLatest }: HomeFeedClientProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  // --- 1. Lanjut Baca (History) ---
  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const rawHistoryItems = isMounted ? getContinueReading(50) : [];
  
  const { isSourceDisabled } = useSourcePreferencesStore();
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

  // Set to keep track of IDs shown in personalized sections for deduplication
  const personalizedIds = new Set<string>();
  historyItems.forEach(item => personalizedIds.add(`${item.sourceId}-${item.mangaId}`));

  // --- 2. Update Hari Ini (Bookmarks intersection with Latest) ---
  const libraryItems = useLibraryStore(state => state.items);
  const bookmarkedIds = new Set(Object.values(libraryItems).map(item => `${item.sourceId}-${item.mangaId}`));

  const updateHariIni = React.useMemo(() => {
    if (!isMounted) return [];
    // Filter unifiedLatest to only those in library, AND not already in Lanjut Baca
    return unifiedLatest.filter(item => {
      const id = `${item.sourceId}-${item.id}`;
      if (bookmarkedIds.has(id) && !personalizedIds.has(id)) {
        personalizedIds.add(id); // Mark as shown
        return true;
      }
      return false;
    });
  }, [isMounted, unifiedLatest, bookmarkedIds, personalizedIds]);

  // --- 3. Sorotan Utama (Top 5 random from Latest, deduplicated from personalized) ---
  const sorotanUtama = React.useMemo(() => {
    const available = unifiedLatest.filter(item => !personalizedIds.has(`${item.sourceId}-${item.id}`));
    // Take 5 (we don't shuffle here to avoid hydration mismatch, let's just slice)
    return available.slice(0, 5);
  }, [unifiedLatest, personalizedIds]);

  // --- 4. Peringkat Populer (Top 5 Popular - NO deduplication per gap review logic) ---
  const peringkatPopuler = unifiedPopular.slice(0, 5);

  // --- 5. Rilis Terbaru (Rest of Latest, deduplicated) ---
  const rilisTerbaru = React.useMemo(() => {
    const sorotanIds = new Set(sorotanUtama.map(item => `${item.sourceId}-${item.id}`));
    return unifiedLatest.filter(item => {
      const id = `${item.sourceId}-${item.id}`;
      return !personalizedIds.has(id) && !sorotanIds.has(id);
    }).slice(0, 8); // Hard limit 8 for 1 carousel row
  }, [unifiedLatest, personalizedIds, sorotanUtama]);

  if (!isMounted) return null; // Avoid hydration mismatch for personalized feeds

  return (
    <div className="flex flex-col gap-10 md:gap-14 animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both pb-20">
      
      {/* 1. Lanjut Baca */}
      {historyItems.length > 0 && (
        <ContinueReadingList items={historyItems} />
      )}

      {/* 2. Update Hari Ini */}
      {updateHariIni.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 px-2">
            <Sparkle weight="duotone" className="text-semantic-info" /> Update Hari Ini
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-2">
            {updateHariIni.map((manga: any) => (
              <div key={`${manga.sourceId}-${manga.id}`} className="shrink-0 snap-start w-[140px] sm:w-[160px]">
                <ShelfCard manga={manga} sourceId={manga.sourceId} showSourceBadge />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sorotan Utama */}
      {sorotanUtama.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 px-2">
            <Fire weight="duotone" className="text-semantic-warning" /> Sorotan Utama
          </h2>
          {/* Modified Hero Carousel container to restrict height */}
          <div className="h-[280px] sm:h-[350px] relative w-full overflow-hidden rounded-[3rem]">
             <FeaturedHeroCarousel sourceId={sorotanUtama[0]?.sourceId || ""} mangas={sorotanUtama} />
          </div>
        </div>
      )}

      {/* 4. Peringkat Populer */}
      {peringkatPopuler.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 mb-2">
            <TrendUp weight="duotone" className="text-accent text-xl md:text-2xl" />
            <h2 className="text-xl md:text-2xl font-bold">Peringkat Populer</h2>
          </div>
          <div className="bg-gradient-to-bl from-accent/5 to-accent/10 dark:from-surface-base dark:to-surface-overlay rounded-[2rem] p-5 sm:p-6 border border-transparent dark:border-border-subtle flex flex-col gap-1 overflow-hidden shadow-sm">
            {peringkatPopuler.map((manga: any, idx: number) => (
              <LeaderboardRow 
                key={`${manga.sourceId}-${manga.id}`} 
                manga={{...manga, rank: idx + 1}} 
                sourceId={manga.sourceId} 
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Rilis Terbaru */}
      {rilisTerbaru.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
              <MagicWand weight="duotone" className="text-accent" /> Rilis Terbaru
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-2">
            {rilisTerbaru.map((manga: any) => (
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
                <span>Lihat Semua</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
