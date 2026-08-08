"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Play, SortAscending, SortDescending, Book, ShareNetwork, CaretLeft } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getReaderHref, getSafeMangaDetailBackHref } from "@/shared/lib/routes";
import { MangaActions } from "@/components/manga/manga-actions";
import { useHistoryStore } from "@/shared/store/history-store";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ChapterRow } from "@/components/manga/chapter-row";
import { MangaRating } from "@/components/manga/manga-rating";
import { MangaRecommendations } from "@/components/manga/manga-recommendations";
import { MangaStatusButton } from "@/components/manga/manga-status-button";
import { MangaCollectionButton } from "@/components/manga/manga-collection-button";
import { YomirraPageHeader } from "@/components/app/header";
import { MangaHeaderActions } from "./manga-header-actions";
import { Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { toast } from "sonner";
import { useRef } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/shared/utils/cn";
import { motion, useScroll, useTransform } from "motion/react";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import type { HTMLMotionProps } from "motion/react";
import type { MangaDetail, Chapter } from "@/shared/types/source";

const CHAPTER_ITEM_ESTIMATED_SIZE = 70;
const SCROLL_Y_RANGE = [50, 150];
const HEADER_BG_OPACITY_RANGE = [0, 0.85];
const HEADER_BLUR_RANGE = [0, 12];
const HEADER_BORDER_OPACITY_RANGE = [0, 0.1];
const HEADER_OPACITY_RANGE = [0, 1];

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

  const { scrollY } = useScroll();
  const headerBgOpacity = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_BG_OPACITY_RANGE);
  const headerBlur = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_BLUR_RANGE);
  const headerBorderOpacity = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_BORDER_OPACITY_RANGE);
  const headerOpacity = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_OPACITY_RANGE);

  // Parallax for desktop cover
  const desktopCoverY = useTransform(scrollY, [0, 600], [0, 80]);

  const revealProps: HTMLMotionProps<"div"> = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  // Calculate Progress
  const continueIdx = chapters ? [...chapters].reverse().findIndex(c => c.id === continueChapterId) + 1 : 0;
  const progressPercent = chapters?.length ? (continueIdx / chapters.length) * 100 : 0;



  const renderMainAction = () => (
    <div className="w-full flex flex-col gap-2 mt-1">
      {showContinue && continueChapterId ? (
        <>
          <Button asChild variant="accent" className="w-full rounded-2xl h-[52px] text-base font-bold shadow-md shadow-accent/20 active:scale-[0.98] transition-all">
            <Link href={getReaderHref(sourceId, mangaId, continueChapterId)} aria-label={`Lanjutkan membaca ${continueChapterLabel}`}>
              <Play className="h-5 w-5 mr-1.5" fill="currentColor" weight="fill" />
              Lanjutkan {continueChapterLabel}
            </Link>
          </Button>
          <div className="flex flex-col gap-1.5 px-1 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-text-muted">{continueIdx} / {chapters?.length || 0} CHAPTER</span>
              <span className="text-[10px] font-bold text-text-muted">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-500 ease-out" style={{ width: `max(4px, ${progressPercent}%)` }} />
            </div>
          </div>
        </>
      ) : startChapterId ? (
        <Button asChild variant="accent" className="w-full rounded-2xl h-[52px] text-base font-bold shadow-md shadow-accent/20 active:scale-[0.98] transition-all">
          <Link href={getReaderHref(sourceId, mangaId, startChapterId)} aria-label="Mulai membaca manga">
            <Play className="h-5 w-5 mr-1.5" fill="currentColor" weight="fill" />
            Mulai Baca
          </Link>
        </Button>
      ) : (
        <Button disabled variant="outline" className="w-full rounded-2xl h-[52px] text-base font-bold bg-surface-raised border-border-default opacity-60">
          Belum ada chapter
        </Button>
      )}
    </div>
  );

  const renderActions = () => (
    <div className="flex w-full mt-2 h-[72px] bg-surface-raised rounded-2xl border border-border-default/50 overflow-hidden divide-x divide-border-default/30">
      <MangaActions
        sourceId={sourceId}
        mangaId={mangaId}
        title={detail.title}
        coverUrl={detail.coverUrl}
        author={detail.author}
        status={detail.status}
      />
      <MangaStatusButton sourceId={sourceId} mangaId={mangaId} />
      <MangaCollectionButton sourceId={sourceId} mangaId={mangaId} />
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      {/* ── Background (Glassmorphism Tint) ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none select-none bg-background [contain:strict]">
        {detail.coverUrl && (
          <Image
            src={detail.coverUrl}
            alt=""
            fill
            className="object-cover opacity-[0.6] dark:opacity-40 blur-[80px] scale-[1.2] saturate-[1.5] transform-gpu will-change-transform"
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-surface-base/20 dark:bg-surface-base/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-base/60 to-surface-base/95" />
      </div>

      <YomirraPageHeader
        title={detail.title}
        showBack={false}
        showTitleOnScrollOnly
        variant="auto"
        action={
          <MangaHeaderActions
            sourceId={sourceId}
            mangaId={mangaId}
            title={detail.title}
          />
        }
      />

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

      {/* ── Main Content Container ── */}
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-20 md:pt-4 relative z-10 flex flex-col md:flex-row gap-5 md:gap-8">

        {/* ── Left Column (Desktop Cover & Actions) ── */}
        <div className="hidden md:flex sticky self-start w-[280px] lg:w-80 shrink-0 flex-col gap-5">
          <div className="relative w-full aspect-[2/3] rounded-[24px] overflow-hidden shadow-glass border border-border-glass bg-surface-glass/95 backdrop-blur-3xl p-3">
            <motion.div
              style={{ y: desktopCoverY }}
              className="relative w-full h-full rounded-[16px] overflow-hidden shadow-heavy border border-white/10 vt-cover-desktop"
            >
              {coverUrl && (
                <Image
                  src={coverUrl}
                  alt={detail.title}
                  fill
                  sizes="(min-width: 768px) 280px, (min-width: 1024px) 320px, 100vw"
                  className="object-cover"
                  priority
                  unoptimized
                />
              )}
            </motion.div>
          </div>

          <div className="bg-surface-glass/95 backdrop-blur-3xl border border-border-glass shadow-glass rounded-[32px] p-6 flex flex-col gap-4">
            {/* ── Action Buttons ── */}
            {renderMainAction()}
            {renderActions()}
          </div>

        </div>

        {/* ── Right Column / Mobile Main Flow ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-4 md:gap-6">

          {/* Mobile Cover + Meta + Actions Card */}
          <div className="relative z-10 w-full mt-[calc(var(--safe-top))] flex flex-col gap-4 md:hidden">
            <div className="rounded-[32px] border border-border-glass bg-surface-glass/95 dark:bg-surface-glass backdrop-blur-3xl shadow-glass p-5 flex flex-col gap-5">

              <div className="flex gap-4 md:gap-5">
                <div className="relative w-[104px] shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-glass border border-border-glass bg-surface-glass vt-cover-mobile">
                  {detail.coverUrl ? (
                    <Image
                      src={detail.coverUrl}
                      alt={detail.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-raised flex items-center justify-center">
                      <Book size={32} weight="duotone" className="text-text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 py-1 overflow-hidden">
                  <h1 className="text-xl font-black tracking-tight text-text-primary leading-[1.15] line-clamp-4 text-balance drop-shadow-sm mb-2 vt-title-mobile">
                    {detail.title}
                  </h1>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="flex items-center gap-1 text-[11px] font-black tracking-widest uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Star weight="fill" size={10} />
                      <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
                    </span>
                    {detail.status && (
                      <span className="flex items-center justify-center bg-surface-raised border border-border-default px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        {detail.status}
                      </span>
                    )}
                    {detail.format && (
                      <span className="flex items-center justify-center bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-accent">
                        {detail.format}
                      </span>
                    )}
                    <span className="flex items-center justify-center bg-surface-raised border border-border-default px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider text-text-secondary">
                      {sourceName}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-text-secondary line-clamp-1 mt-auto">
                    {detail.author || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Injected Actions for Mobile */}
              <div className="flex flex-col gap-3 pt-3 border-t border-border-glass">
                {renderMainAction()}
                {renderActions()}
              </div>
            </div>
          </div>

          {/* Desktop Title & Info Header */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <span className="flex items-center gap-1 bg-amber-400/10 text-amber-500 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider">
                <Star weight="fill" size={12} />
                <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
              </span>
              {detail.status && (
                <span className="flex items-center justify-center bg-surface-raised px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  {detail.status}
                </span>
              )}
              {detail.format && (
                <span className="flex items-center justify-center bg-accent/10 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-accent">
                  {detail.format}
                </span>
              )}
              <span className="flex items-center justify-center bg-surface-raised px-2 py-1 rounded-md text-[10px] font-bold tracking-wider text-text-secondary">
                {sourceName}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-[1.1] vt-title-mobile vt-title-desktop line-clamp-3">
                {detail.title}
              </h1>
              <MangaHeaderActions
                sourceId={sourceId}
                mangaId={mangaId}
                title={detail.title}
              />
            </div>
            <p className="text-sm font-semibold text-text-secondary">
              {detail.author || 'Unknown'}
            </p>
          </div>

          {/* Synopsis Card (Medium Surface) */}
          <motion.div
            {...revealProps}
            className="rounded-2xl border border-border-default/40 bg-surface-raised/40 backdrop-blur-sm p-4 md:p-5"
          >
            <span className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-2">Sinopsis</span>
            <p className={cn(
              "text-[13px] md:text-sm leading-relaxed text-text-secondary break-words transition-all",
              !isExpanded && "line-clamp-4"
            )}>
              {detail.description?.replace(/\s+/g, ' ').trim() || "Sinopsis belum tersedia."}
            </p>
            {detail.description && detail.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-[13px] font-bold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
              >
                {isExpanded ? "Tampilkan lebih sedikit" : "Selengkapnya"}
              </button>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {detail.genres?.map((g) => (
                <Link
                  key={g}
                  href={`/library?source=${sourceId}&genre=${encodeURIComponent(g)}`}
                  className="rounded-md bg-black/5 dark:bg-white/5 px-2 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Chapters Section (Flattened) */}
          <motion.div
            {...revealProps}
            className="mt-4 flex flex-col"
          >
            <div className="sticky top-[60px] z-20 bg-background/80 backdrop-blur-xl py-3 px-1 border-b border-border-default/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold tracking-tight text-text-primary">
                  {chapters?.length || 0} Chapter
                </span>
                <span className="text-[11px] font-semibold text-text-muted">
                  {sortOrder === "desc" ? "Terbaru" : "Terlama"}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari chapter..."
                  aria-label="Cari chapter"
                  containerClassName="flex-1"
                />
                <IconButton
                  variant="surface"
                  size="sm"
                  className="min-h-[40px] min-w-[40px] shrink-0 bg-surface-raised border-border-default rounded-xl"
                  onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                  aria-label={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
                >
                  {sortOrder === "desc" ? <SortDescending size={18} /> : <SortAscending size={18} />}
                </IconButton>
              </div>
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
                className="flex flex-col max-h-[60vh] md:max-h-[500px] overflow-y-auto overflow-x-hidden pt-3 pr-2 -mr-2 [scrollbar-width:thin]"
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
                          paddingBottom: '6px',
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
          </motion.div>

          <motion.div {...revealProps} className="mt-4">
            <MangaRecommendations
              sourceId={sourceId}
              currentMangaId={mangaId}
              genres={detail.genres || []}
            />
          </motion.div>

        </div>
      </div>
    </main>
  );
}
