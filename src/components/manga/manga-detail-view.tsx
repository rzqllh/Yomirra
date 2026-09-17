"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { Play, SortAscending, SortDescending, Book, CaretLeft } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getReaderHref, getSafeMangaDetailBackHref } from "@/shared/lib/routes";
import { MangaActions } from "@/components/manga/manga-actions";
import { useHistoryStore } from "@/shared/store/history-store";
import { Button } from "@/components/ui/button";
import { ChapterRow } from "@/components/manga/chapter-row";
import { MangaRecommendations } from "@/components/manga/manga-recommendations";
import { MangaStatusButton } from "@/components/manga/manga-status-button";
import { MangaCollectionButton } from "@/components/manga/manga-collection-button";
import { PageHeader } from "@/components/app/header";
import { MangaHeaderActions } from "./manga-header-actions";
import { Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useRef } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/shared/utils/cn";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import type { MangaDetail, Chapter } from "@/shared/types/source";

const CHAPTER_ITEM_ESTIMATED_SIZE = 70;

interface MangaDetailViewProps {
  sourceId: string;
  mangaId: string;
  detail: MangaDetail;
  chapters: Chapter[];
}

export function MangaDetailView({
  sourceId,
  mangaId,
  detail,
  chapters,
}: MangaDetailViewProps) {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const isMounted = useMounted();

  const { data: ratingData } = useQuery({
    queryKey: ["rating-score", sourceId, mangaId],
    queryFn: () => apiClient.getRatingScore(detail.title),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: true,
  });

  const ratingScore = ratingData?.score;
  const displayScore = ratingScore ?? detail.score;
  const sourceName = dynamicSourceRegistry.get(sourceId)?.name || sourceId;

  const safeId = `${sourceId}-${mangaId}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const coverTransitionName = `manga-cover-${safeId}`;
  const titleTransitionName = `manga-title-${safeId}`;

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const backHref = getSafeMangaDetailBackHref(returnTo);

  const getLatestForManga = useHistoryStore((state) => state.getLatestForManga);
  const historyItems = useHistoryStore((state) => state.items); // keep subscription
  const historyItem = isMounted ? getLatestForManga(sourceId, mangaId) : undefined;

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const sortedChapters = useMemo(() => {
    if (!chapters) return [];
    let result = chapters;
    if (deferredSearchQuery.trim()) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(lowerQuery));
    }
    if (sortOrder === "asc") return [...result].reverse();
    return result;
  }, [chapters, sortOrder, deferredSearchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedChapters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CHAPTER_ITEM_ESTIMATED_SIZE,
    overscan: 20,
  });

  // Always reset scroll to the top when viewing manga details
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [sourceId, mangaId]);

  const coverUrl = detail.coverUrl;
  const firstChapter = chapters?.[chapters.length - 1];

  const showContinue = !!historyItem;
  const continueChapterId = historyItem?.chapterId;
  const startChapterId = firstChapter?.id;

  const continueChapterLabel = useMemo(() => {
    if (!continueChapterId) return "";
    const match = chapters?.find(c => c.id === continueChapterId);
    if (match) return match.title || `Chapter ${match.number}`;
    if (historyItem?.chapterTitle) return historyItem.chapterTitle;
    return "Chapter";
  }, [continueChapterId, chapters, historyItem]);

  const renderMainAction = () => {
    if (!startChapterId && !continueChapterId) {
      return (
        <div className="w-full mt-2">
          <Button disabled variant="outline" className="w-full rounded-[16px] h-[52px] text-base font-bold bg-surface-raised border-border-default opacity-60">
            Belum ada chapter
          </Button>
        </div>
      );
    }

    const isContinue = showContinue && !!continueChapterId;
    const targetChapterId = (isContinue ? continueChapterId : startChapterId)!;
    const primaryLabel = isContinue ? "Lanjutkan" : "Mulai Baca";
    const companionLabel = isContinue 
      ? continueChapterLabel.replace('Chapter', 'Ch.') 
      : (firstChapter ? (firstChapter.title?.startsWith('Ch') ? firstChapter.title : `Chapter ${firstChapter.number || 1}`) : "Chapter 1");

    return (
      <div className="w-full mt-2">
        <Button
          asChild
          variant="accent"
          className="w-full rounded-[16px] h-[52px] text-base font-bold flex items-center justify-center gap-2.5 bg-[#5B65E9] hover:bg-[#4C55C4] text-white shadow-[0_4px_16px_rgba(91,101,233,0.35)] active:scale-[0.98] transition-all"
        >
          <Link
            href={getReaderHref(sourceId, mangaId, targetChapterId)}
            aria-label={`${primaryLabel} - ${companionLabel}`}
          >
            <Play className="h-[18px] w-[18px] shrink-0" fill="currentColor" weight="fill" />
            <span className="tracking-tight">{primaryLabel}</span>
            <span className="text-white/40 font-normal select-none">•</span>
            <span className="text-[14px] font-medium text-white/90 tracking-tight truncate max-w-[160px]">
              {companionLabel}
            </span>
          </Link>
        </Button>
      </div>
    );
  };

  const renderActions = () => (
    <div className="grid grid-cols-4 w-full mt-2 gap-2 h-[68px]">
      <MangaActions
        sourceId={sourceId}
        mangaId={mangaId}
        title={detail.title}
        coverUrl={detail.coverUrl}
        author={detail.author}
        status={detail.status}
      />
      <MangaStatusButton sourceId={sourceId} mangaId={mangaId} />
      <MangaCollectionButton
        sourceId={sourceId}
        mangaId={mangaId}
        mangaDetail={{
          title: detail.title,
          coverUrl: detail.coverUrl,
          author: detail.author,
          status: detail.status,
        }}
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col w-full relative text-text-primary bg-surface-base">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 767px) { 
          .vt-cover-mobile { view-transition-name: ${coverTransitionName}; } 
          .vt-title-mobile { view-transition-name: ${titleTransitionName}; } 
        }
        @media (min-width: 768px) { 
          .vt-cover-desktop { view-transition-name: ${coverTransitionName}; } 
          .vt-title-desktop { view-transition-name: ${titleTransitionName}; } 
        }
      `}} />

      {/* ── 1. Hero Scope (Backdrop strictly ends after secondary actions) ── */}
      <section className="relative w-full overflow-hidden select-none">
        {/* Backdrop Image with subtle blur, dark scrim for contrast, and smooth bottom fade into solid page background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {detail.coverUrl && (
            <Image
              src={detail.coverUrl}
              alt=""
              fill
              className="object-cover opacity-80 dark:opacity-60 blur-[6px] scale-105 transform-gpu brightness-[0.75] dark:brightness-[0.45]"
              unoptimized
              priority
            />
          )}
          {/* Dark scrim: preserves artwork recognizability in center while guaranteeing header/text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/45 via-45% to-transparent" />
          {/* Progressive bottom fade that seamlessly blends artwork into solid page background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-base/60 via-65% to-surface-base" />
        </div>

        {/* Page Header (Contextual Back, Title on scroll, Share, Notification) */}
        <PageHeader
          title={detail.title}
          showBack={true}
          backHref={backHref}
          mode="detail"
          variant="transparent"
          actions={
            <MangaHeaderActions
              sourceId={sourceId}
              mangaId={mangaId}
              title={detail.title}
            />
          }
        />

        {/* Hero Content Container */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-20 pb-4 md:pb-6 relative z-10">
          {/* Mobile Hero Flow */}
          <div className="flex flex-col gap-4 md:hidden">
            <div className="flex gap-4 relative items-end">
              <div 
                className="relative shrink-0 aspect-[2/3] rounded-[18px] overflow-hidden shadow-heavy ring-1 ring-white/20 bg-surface-raised vt-cover-mobile z-20"
                style={{ width: 'clamp(130px, 36vw, 165px)' }}
              >
                {detail.coverUrl ? (
                  <Image
                    src={detail.coverUrl}
                    alt={detail.title}
                    fill
                    sizes="(max-width: 768px) 36vw, 165px"
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-surface-raised flex items-center justify-center">
                    <Book size={32} weight="duotone" className="text-text-muted" />
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 overflow-hidden pb-1">
                <div className="mb-2">
                  <span className="inline-flex items-center bg-white/20 dark:bg-white/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-2 border border-white/20 shadow-xs">
                    {detail.format || "Manga"}
                  </span>
                  <h1 className="text-[22px] sm:text-[26px] font-black tracking-tight text-white leading-[1.1] line-clamp-3 text-balance drop-shadow-sm vt-title-mobile">
                    {detail.title}
                  </h1>
                  {detail.originalTitle && (
                    <p className="text-[12px] font-medium text-white/70 mt-1 truncate">
                      {detail.originalTitle}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-2.5">
                  <span className="flex items-center gap-1 text-[11px] font-black tracking-wide text-amber-300 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-amber-400/30 shadow-xs">
                    <Star weight="fill" size={12} className="text-amber-400" />
                    <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
                  </span>
                  {detail.status && (
                    <span className="flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                      {detail.status}
                    </span>
                  )}
                </div>
                
                <div className="mt-auto flex flex-col gap-0.5">
                  <p className="text-sm font-bold text-white line-clamp-1 drop-shadow-xs">
                    {detail.author || 'Unknown'}
                  </p>
                  <p className="text-[11px] font-medium text-white/75 leading-snug">
                    Diunggah oleh <span className="text-indigo-300 font-semibold">{sourceName.toLowerCase()}</span> • Sumber: Webtoon
                  </p>
                </div>
              </div>
            </div>

            {/* Primary CTA + Chapter Companion */}
            {renderMainAction()}

            {/* 4 Secondary Actions */}
            {renderActions()}
          </div>

          {/* Desktop Hero Flow */}
          <div className="hidden md:flex gap-8 items-end">
            {/* Desktop Cover */}
            <div className="relative w-[220px] lg:w-[240px] shrink-0 aspect-[2/3] rounded-[20px] overflow-hidden shadow-heavy ring-1 ring-white/20 bg-surface-raised vt-cover-desktop z-20">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={detail.title}
                  fill
                  sizes="(min-width: 768px) 220px, 240px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-surface-raised flex items-center justify-center">
                  <Book size={48} weight="duotone" className="text-text-muted" />
                </div>
              )}
            </div>

            {/* Desktop Metadata + Actions */}
            <div className="flex-1 flex flex-col gap-3 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest text-white">
                  {detail.format || "Manga"}
                </span>
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-amber-300 px-2.5 py-0.5 rounded-[6px] text-[11px] font-black tracking-wide border border-amber-400/30 shadow-xs">
                  <Star weight="fill" size={12} className="text-amber-400" />
                  <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
                </span>
                {detail.status && (
                  <span className="flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider text-white">
                    {detail.status}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-[1.15] text-white drop-shadow-sm vt-title-desktop">
                  {detail.title}
                </h1>
                {detail.originalTitle && (
                  <p className="text-sm font-medium text-white/70 mt-1">
                    {detail.originalTitle}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                <p className="text-base font-bold text-white drop-shadow-xs">
                  {detail.author || 'Unknown'}
                </p>
                <p className="text-xs font-medium text-white/75">
                  Diunggah oleh <span className="text-indigo-300 font-semibold">{sourceName.toLowerCase()}</span> • Sumber: Webtoon
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 max-w-2xl">
                <div className="flex-1 min-w-[280px]">
                  {renderMainAction()}
                </div>
                <div className="w-full sm:w-[320px]">
                  {renderActions()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Content Surface (Solid Opaque Page Surface - Readability First) ── */}
      <div className="w-full relative z-10 bg-surface-base">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col gap-6">

          {/* 1. Synopsis (Solid surface, no glass backdrop) */}
          <div className="rounded-2xl border border-border-default/80 bg-surface-raised p-4 md:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Sinopsis</span>
              {detail.description && detail.description.length > 150 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[11px] font-bold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
                >
                  {isExpanded ? "Tampilkan lebih sedikit" : "Selengkapnya"}
                  <CaretLeft size={10} className={cn("transition-transform", isExpanded ? "rotate-90" : "rotate-180")} weight="bold" />
                </button>
              )}
            </div>
            
            <p className={cn(
              "text-[13px] md:text-sm leading-relaxed text-text-secondary break-words transition-all",
              !isExpanded && "line-clamp-4"
            )}>
              {detail.description?.replace(/\s+/g, ' ').trim() || "Sinopsis belum tersedia."}
            </p>

            {/* 2. Genre Tags beneath synopsis */}
            {detail.genres && detail.genres.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {detail.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/library?source=${sourceId}&genre=${encodeURIComponent(g)}`}
                    className="rounded-full bg-surface-base border border-border-default/80 px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3, 4, 5. Chapter Section (Solid surface, flattened rows) */}
          <div className="flex flex-col">
            <div className="sticky top-[60px] z-20 bg-surface-base py-3.5 px-0.5 border-b border-border-default/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-lg md:text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                  {chapters?.length || 0} Chapter
                </span>
                <button 
                  onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-text-muted hover:text-text-primary transition-colors py-1 px-2 rounded-lg hover:bg-surface-hover"
                >
                  {sortOrder === "desc" ? "Terbaru" : "Terlama"}
                  {sortOrder === "desc" ? <SortDescending size={16} /> : <SortAscending size={16} />}
                </button>
              </div>

              {chapters && chapters.length > 20 && (
                <div className="flex items-center gap-2.5 w-full">
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari chapter..."
                    aria-label="Cari chapter"
                    containerClassName="flex-1 h-[42px] rounded-xl bg-surface-raised border border-border-default/80 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20"
                  />
                </div>
              )}
            </div>

            {!chapters || chapters.length === 0 ? (
              <EmptyState
                icon={<Book size={32} weight="duotone" />}
                title="Belum ada chapter"
                description="Manga ini belum memiliki chapter atau sedang error saat memuat data."
                className="my-6"
              />
            ) : (
              <div
                ref={parentRef}
                className="flex flex-col max-h-[60vh] md:max-h-[500px] overflow-y-auto overflow-x-hidden pt-2 pr-2 -mr-2 [scrollbar-width:thin]"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const chapter = sortedChapters[virtualRow.index];
                    const isRead = historyItems[`${sourceId}::${mangaId}::${chapter.id}`] !== undefined;
                    const isLastRead = historyItem?.chapterId === chapter.id;

                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                          paddingBottom: '4px',
                        }}
                      >
                        <ChapterRow
                          sourceId={sourceId}
                          mangaId={mangaId}
                          chapterId={chapter.id}
                          chapterTitle={chapter.title}
                          mangaTitle={detail.title}
                          date={chapter.date}
                          isRead={isRead}
                          isLastRead={isLastRead}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Similar Manga */}
          <div className="pb-1">
            <MangaRecommendations
              sourceId={sourceId}
              currentMangaId={mangaId}
              genres={detail.genres || []}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
