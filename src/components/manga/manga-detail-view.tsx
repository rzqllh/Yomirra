"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Play, SortAscending, SortDescending, Book } from "@phosphor-icons/react";
import { CaretLeft } from "@phosphor-icons/react";
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
import { Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/shared/utils/cn";
import { motion, useScroll, useTransform } from "motion/react";
import type { MangaDetail, Chapter } from "@/shared/types/source";

const CHAPTER_ITEM_ESTIMATED_SIZE = 70;
const SCROLL_Y_RANGE = [50, 150];
const HEADER_BG_OPACITY_RANGE = [0, 0.85];
const HEADER_BLUR_RANGE = [0, 12];
const HEADER_BORDER_OPACITY_RANGE = [0, 0.1];

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

  const { data: anilistData } = useQuery({
    queryKey: ["anilist-score", detail.title],
    queryFn: () => apiClient.getAnilistScore(detail.title),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const displayScore = anilistData?.score ?? detail.score;

  const safeId = `${sourceId}-${mangaId}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const coverTransitionName = `manga-cover-${safeId}`;
  
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
  });

  const coverUrl = detail.coverUrl;
  const firstChapter = chapters?.[chapters.length - 1];

  const showContinue = !!historyItem;
  const continueChapterId = historyItem?.chapterId;
  const startChapterId = firstChapter?.id;

  const { scrollY } = useScroll();
  const headerBgOpacity = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_BG_OPACITY_RANGE);
  const headerBackdropBlur = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_BLUR_RANGE);
  const headerBorderOpacity = useTransform(scrollY, SCROLL_Y_RANGE, HEADER_BORDER_OPACITY_RANGE);

  const renderActions = () => (
    <>
      {showContinue && continueChapterId ? (
        <Button asChild variant="accent" className="w-full rounded-full h-12 text-base font-bold ">
          <Link href={getReaderHref(sourceId, mangaId, continueChapterId)}>
            <Play className="h-5 w-5" fill="currentColor" weight="fill" />
            Lanjut baca
          </Link>
        </Button>
      ) : startChapterId ? (
        <Button asChild variant="accent" className="w-full rounded-full h-12 text-base font-bold ">
          <Link href={getReaderHref(sourceId, mangaId, startChapterId)}>
            <Play className="h-5 w-5" fill="currentColor" weight="fill" />
            Mulai baca
          </Link>
        </Button>
      ) : null}

      <MangaActions 
        sourceId={sourceId}
        mangaId={mangaId}
        title={detail.title}
        coverUrl={detail.coverUrl}
        author={detail.author}
        status={detail.status}
      />
    </>
  );

  return (
    <main className="min-h-screen flex flex-col w-full relative">
      <div 
        className="fixed top-[calc(var(--safe-top)+12px)] left-4 right-4 z-50 md:hidden flex items-center gap-3 pointer-events-none"
      >
        <div className="bg-surface-glass backdrop-blur-md rounded-full w-[46px] h-[46px] pointer-events-auto shrink-0 flex items-center justify-center">
          <Link 
            href={backHref}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-text-primary hover:bg-black/5 dark:hover:bg-surface-hover transition-colors drop-shadow-sm"
          >
            <CaretLeft size={20} weight="bold" />
          </Link>
        </div>
        <motion.div 
          className="flex-1 bg-surface-glass backdrop-blur-md rounded-full px-4 h-[46px] pointer-events-auto overflow-hidden flex items-center justify-center"
          style={{ opacity: useTransform(scrollY, [80, 150], [0, 1]) }}
        >
          <span className="font-bold text-sm line-clamp-1 text-text-primary text-center">
            {detail.title}
          </span>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) { .vt-cover-mobile { view-transition-name: ${coverTransitionName}; } }
        @media (min-width: 768px) { .vt-cover-desktop { view-transition-name: ${coverTransitionName}; } }
      `}} />

      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none select-none bg-background">
        {detail.coverUrl && (
            <Image
              src={detail.coverUrl}
              alt=""
              fill
              className="object-cover opacity-60 blur-[120px] scale-[1.5] saturate-[2] brightness-75 md:brightness-100 transform-gpu will-change-[transform,filter]"
              unoptimized
              priority
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-12 relative z-10 flex flex-col md:flex-row gap-6 md:gap-10">
        
        <div className="flex gap-4 md:hidden">
          <div 
            className="relative w-[110px] shrink-0 aspect-[2/3] rounded-md overflow-hidden shadow-heavy border border-border-default bg-surface-base vt-cover-mobile"
          >
            {coverUrl && (
              <Image 
                src={coverUrl} 
                alt={detail.title} 
                fill
                sizes="110px"
                className="object-cover" 
                priority
                unoptimized
              />
            )}
          </div>
          <div className="flex flex-col flex-1 gap-1.5 justify-center py-1">
            <h1 className="text-xl font-bold leading-snug line-clamp-3 text-shadow-sm">{detail.title}</h1>
            <div className="text-sm font-medium text-text-muted">{detail.author}</div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-text-primary bg-surface-overlay border border-border-default px-1.5 py-0.5 rounded-sm text-2xs uppercase tracking-wider font-bold">{detail.status}</span>
              <span className="flex items-center gap-1 font-semibold text-sm">
                <Star weight="fill" className="text-semantic-warning" />
                <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
              </span>
              <span>•</span>
              <MangaRating sourceId={sourceId} mangaId={mangaId} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2 md:hidden">
          {renderActions()}
        </div>

        <div className="hidden md:flex relative sticky top-[100px] self-start w-[280px] lg:w-80 shrink-0 flex-col gap-4">
          <div 
            className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-heavy border border-border-default bg-surface-base vt-cover-desktop"
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
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {renderActions()}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4">
            
            <div className="hidden md:flex flex-col gap-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-tight text-balance">
                {detail.title}
              </h1>
              <div className="flex items-center gap-2 text-base font-medium text-text-muted">
                <span>{detail.author}</span>
                <span>•</span>
                <span className="text-text-primary bg-surface-overlay px-2 py-0.5 rounded-sm text-xs uppercase tracking-wider font-bold">{detail.status}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Star weight="fill" className="text-semantic-warning" />
                  <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
                </span>
                <span>•</span>
                <MangaRating sourceId={sourceId} mangaId={mangaId} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              {detail.genres?.map((g) => (
                <Link 
                  key={g} 
                  href={`/library?source=${sourceId}&genre=${encodeURIComponent(g)}`}
                  className="rounded-sm bg-surface-overlay px-2 py-1 text-[11px] md:text-xs font-semibold text-text-primary border border-border-default uppercase tracking-wider hover:bg-accent/10 hover:text-accent hover:border-accent transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>

            <div className="mt-2 md:mt-4 bg-surface-base border border-border-default rounded-lg p-4 md:p-6">
              <p className={cn(
                "text-sm md:text-base leading-relaxed text-text-secondary whitespace-pre-wrap break-words transition-all", 
                !isExpanded && "line-clamp-3" 
              )}>
                {detail.description || "Sinopsis belum tersedia."}
              </p>
              
              {detail.description && detail.description.length > 200 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-3 text-sm font-semibold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
                >
                  {isExpanded ? "Tampilkan lebih sedikit" : "Selengkapnya"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 md:mt-10">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-default pb-3 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg md:text-xl font-bold text-text-primary">Chapter</h3>
                <span className="text-sm text-text-muted font-bold">{chapters?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <SearchInput 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari chapter..." 
                  containerClassName="w-full sm:w-[220px]"
                />
                <IconButton 
                  variant="ghost" 
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                  aria-label={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
                >
                  {sortOrder === "desc" ? <SortDescending size={20} /> : <SortAscending size={20} />}
                </IconButton>
              </div>
            </div>

            {!chapters || chapters.length === 0 ? (
              <EmptyState 
                icon={<Book size={32} weight="duotone" />}
                title="Belum ada chapter"
                description="Manga ini belum memiliki chapter atau sedang error saat memuat data."
                className="my-8"
              />
            ) : (
              <div 
                ref={parentRef}
                className="flex flex-col max-h-[60vh] md:max-h-[500px] overflow-y-auto pr-2 -mr-2 [scrollbar-width:thin]"
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
                          paddingBottom: '8px',
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

          <MangaRecommendations 
            sourceId={sourceId}
            currentMangaId={mangaId}
            genres={detail.genres || []}
          />
        </div>
      </div>
    </main>
  );
}
