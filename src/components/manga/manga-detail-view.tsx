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
import { MangaSourceSelector } from "./manga-source-selector";
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
import { MangaDetailLayout } from "./manga-detail-layout";
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
          className="w-full rounded-[16px] h-[52px] text-base font-bold flex items-center justify-center gap-2.5 bg-accent hover:bg-accent/90 text-white shadow-md active:scale-[0.98] transition-all"
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

  // Secondary actions — 4 buttons placed inside the shared 2x2 / flex grid
  const renderActions = () => (
    <>
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
    </>
  );

  return (
    <>
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

      <MangaDetailLayout
        backdrop={
          detail.coverUrl ? (
            <Image
              src={detail.coverUrl}
              alt=""
              fill
              className="object-cover opacity-85 dark:opacity-70 blur-[8px] scale-110 transform-gpu brightness-[0.85] dark:brightness-[0.55]"
              unoptimized
              priority
            />
          ) : null
        }
        header={
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
        }
        mobileCoverClassName="vt-cover-mobile"
        mobileCover={
          detail.coverUrl ? (
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
          )
        }
        mobileMeta={
          <>
            <div className="mb-2">
              <span className="inline-flex items-center bg-white/20 dark:bg-white/10 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white mb-2 border border-white/20 shadow-xs">
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
              <span className="flex items-center gap-1 text-[11px] font-black tracking-wide text-amber-300 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-amber-400/30 shadow-xs">
                <Star weight="fill" size={12} className="text-amber-400" />
                <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
              </span>
              {detail.status && (
                <span className="flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                  {detail.status}
                </span>
              )}
              <MangaSourceSelector
                sourceId={sourceId}
                mangaId={mangaId}
                title={detail.title}
              />
            </div>

            <div className="mt-auto flex flex-col gap-0.5">
              <p className="text-sm font-bold text-white line-clamp-1 drop-shadow-xs">
                {detail.author || 'Unknown'}
              </p>
              <p className="text-[11px] font-medium text-white/75 leading-snug">
                Diunggah oleh <span className="text-indigo-300 font-semibold">{sourceName.toLowerCase()}</span> • Sumber: Webtoon
              </p>
            </div>
          </>
        }
        desktopCoverClassName="vt-cover-desktop"
        desktopCover={
          coverUrl ? (
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
          )
        }
        desktopMeta={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white">
                {detail.format || "Manga"}
              </span>
              <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-amber-300 px-2.5 py-0.5 rounded-lg text-[11px] font-black tracking-wide border border-amber-400/30 shadow-xs">
                <Star weight="fill" size={12} className="text-amber-400" />
                <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
              </span>
              {detail.status && (
                <span className="flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                  {detail.status}
                </span>
              )}
              <MangaSourceSelector
                sourceId={sourceId}
                mangaId={mangaId}
                title={detail.title}
              />
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl xl:text-[42px] font-black tracking-tight leading-[1.15] text-white drop-shadow-sm vt-title-desktop max-w-2xl">
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
          </>
        }
        mainAction={renderMainAction()}
        actions={renderActions()}
        synopsis={
          <>
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

            {detail.genres && detail.genres.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {detail.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/library?source=${sourceId}&genre=${encodeURIComponent(g)}`}
                    className="rounded-xl bg-surface-base border border-border-default/80 px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </>
        }
        chapters={
          <>
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
                          isLocked={chapter.isLocked}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        }
        recommendations={
          <MangaRecommendations
            sourceId={sourceId}
            currentMangaId={mangaId}
            genres={detail.genres || []}
          />
        }
      />
    </>
  );
}
