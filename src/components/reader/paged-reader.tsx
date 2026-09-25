"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useReaderStore } from "@/shared/store/reader-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { getOfflineImageUrl } from "@/shared/utils/download-helpers";
import { PageItem, Chapter } from "@/shared/types/source";
import { ReaderImage } from "./reader-image";
import { getReaderHref } from "@/shared/lib/routes";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { useVisibilityFlush } from "@/shared/hooks/use-visibility-flush";
import { useReadingTimer } from "@/shared/hooks/use-reading-timer";
import { CaretLeft, CaretRight, Warning, Flag } from "@phosphor-icons/react";
import { ReportSheet } from "@/components/shared/report-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { motion, PanInfo } from "motion/react";
import { toast } from "sonner";

interface PagedReaderProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterTitle?: string;
  pages: PageItem[];
  chapters?: Chapter[];
  prevChapterId?: string;
  nextChapterId?: string;
  onOpenAlternateSource?: () => void;
  onRefreshChapter?: () => Promise<PageItem[] | null>;
}

export function PagedReader({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle = "Chapter",
  pages,
  chapters: _chapters,
  prevChapterId,
  nextChapterId,
  onOpenAlternateSource,
  onRefreshChapter,
}: PagedReaderProps) {
  const router = useRouter();
  const preferences = useReaderStore(state => state.preferences);
  const toggleOverlay = useReaderStore(state => state.toggleOverlay);
  const setPagedProgress = useReaderStore(state => state.setPagedProgress);
  const { dataSaver } = useSettingsStore();
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId));
  const saveProgress = useHistoryStore(state => state.saveProgress);
  const getProgress = useHistoryStore(state => state.getLatestForManga);
  const hasHydrated = useHistoryStore(state => state._hasHydrated);
  const historyItem = useHistoryStore(state => {
    const id = `${sourceId}::${mangaId}::${chapterId}`;
    return state.items[id] || state.getLatestForManga(sourceId, mangaId);
  });
  const source = React.useMemo(() => getSourceMetadata(sourceId), [sourceId]);

  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [reportPageIndex, setReportPageIndex] = React.useState<number | undefined>(undefined);

  const handleReport = React.useCallback((pageIdx?: number) => {
    setReportPageIndex(typeof pageIdx === "number" ? pageIdx : undefined);
    setIsReportOpen(true);
  }, []);

  useReadingTimer();

  const [currentPages, setCurrentPages] = React.useState<PageItem[]>(pages);
  React.useEffect(() => {
    setCurrentPages(pages);
  }, [pages]);

  const [failedPageIndices, setFailedPageIndices] = React.useState<Set<number>>(new Set());

  const handleImageLoad = React.useCallback((pageIndex: number) => {
    setFailedPageIndices((prev) => {
      if (!prev.has(pageIndex)) return prev;
      const next = new Set(prev);
      next.delete(pageIndex);
      return next;
    });
  }, []);

  const handlePermanentFailure = React.useCallback((pageIndex: number) => {
    setFailedPageIndices((prev) => {
      if (prev.has(pageIndex)) return prev;
      const next = new Set(prev);
      next.add(pageIndex);
      return next;
    });
  }, []);

  // Initialize active page from history once store is hydrated
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(0);

  React.useEffect(() => {
    if (hasInitialized) return;
    const isStoreReady =
      hasHydrated ||
      (useHistoryStore.persist?.hasHydrated ? useHistoryStore.persist.hasHydrated() : false) ||
      !!historyItem;

    if (!isStoreReady) return;

    const saved = historyItem;
    if (saved && saved.chapterId === chapterId && typeof saved.pageIndex === "number") {
      setCurrentPageIndex(Math.max(0, Math.min(saved.pageIndex, currentPages.length - 1)));
    }
    setHasInitialized(true);
  }, [hasHydrated, historyItem, chapterId, currentPages.length, hasInitialized]);

  const totalPages = currentPages.length;
  const isRtl = preferences.readingDirection === "rtl";

  // Clamp page index when pages prop changes
  React.useEffect(() => {
    if (hasInitialized) {
      setCurrentPageIndex(prev => Math.max(0, Math.min(prev, currentPages.length - 1)));
    }
  }, [currentPages.length, hasInitialized]);

  // Sync page progress to reader store for header progress bar
  React.useEffect(() => {
    if (totalPages > 0 && hasInitialized) {
      setPagedProgress((currentPageIndex + 1) / totalPages);
    }
  }, [currentPageIndex, totalPages, setPagedProgress, hasInitialized]);

  // Persist page progress only after initialization
  const flushProgress = React.useCallback(() => {
    if (totalPages > 0 && hasInitialized) {
      saveProgress(sourceId, mangaId, chapterId, currentPageIndex, totalPages);
    }
  }, [currentPageIndex, totalPages, sourceId, mangaId, chapterId, saveProgress, hasInitialized]);

  React.useEffect(() => {
    if (hasInitialized) {
      flushProgress();
    }
  }, [flushProgress, hasInitialized]);

  useVisibilityFlush(flushProgress);

  const queryClient = useQueryClient();

  // Predictive preload: prefetch next chapter pages when user reaches last 2 pages
  React.useEffect(() => {
    if (nextChapterId && totalPages > 0 && currentPageIndex >= totalPages - 2 && typeof navigator !== "undefined" && navigator.onLine) {
      queryClient.prefetchQuery({
        queryKey: ["pages", sourceId, nextChapterId],
        queryFn: () => apiClient.getPages(sourceId, mangaId, nextChapterId),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [nextChapterId, totalPages, currentPageIndex, queryClient, sourceId, mangaId]);

  const goToNextPage = React.useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else if (nextChapterId) {
      router.replace(getReaderHref(sourceId, mangaId, nextChapterId));
    }
  }, [currentPageIndex, totalPages, nextChapterId, router, sourceId, mangaId]);

  const goToPrevPage = React.useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    } else if (prevChapterId) {
      router.replace(getReaderHref(sourceId, mangaId, prevChapterId));
    }
  }, [currentPageIndex, prevChapterId, router, sourceId, mangaId]);

  // Left & Right Tap Handlers mapping
  const handleLeftTap = React.useCallback(() => {
    if (isRtl) {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  }, [isRtl, goToNextPage, goToPrevPage]);

  const handleRightTap = React.useCallback(() => {
    if (isRtl) {
      goToPrevPage();
    } else {
      goToNextPage();
    }
  }, [isRtl, goToNextPage, goToPrevPage]);

  // Keyboard navigation listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (isRtl) {
          goToPrevPage();
        } else {
          goToNextPage();
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (isRtl) {
          goToNextPage();
        } else {
          goToPrevPage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRtl, goToNextPage, goToPrevPage]);

  // Touch Swipe Handler with iOS Edge-Swipe Isolation
  const [canDrag, setCanDrag] = React.useState(true);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      const touchX = e.touches[0].clientX;
      const EDGE_THRESHOLD = 24;
      if (typeof window !== "undefined" && (touchX < EDGE_THRESHOLD || touchX > window.innerWidth - EDGE_THRESHOLD)) {
        setCanDrag(false);
        return;
      }
    }
    setCanDrag(true);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 50;

    if (offset < -threshold || velocity < -300) {
      // Swiped Left
      if (isRtl) {
        goToPrevPage();
      } else {
        goToNextPage();
      }
    } else if (offset > threshold || velocity > 300) {
      // Swiped Right
      if (isRtl) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }
  };

  const currentPage = currentPages[currentPageIndex];
  const currentUrl = isDownloaded
    ? getOfflineImageUrl({ sourceId, mangaId, chapterId, pageIndex: currentPage?.index ?? currentPageIndex })
    : currentPage?.url ?? "";

  const leftLabel = isRtl ? "Area ketuk halaman berikutnya" : "Area ketuk halaman sebelumnya";
  const rightLabel = isRtl ? "Area ketuk halaman sebelumnya" : "Area ketuk halaman berikutnya";

  return (
    <div className="relative min-h-screen w-full bg-surface-base select-none flex flex-col items-center justify-center pt-[calc(var(--mobile-header-height)+var(--safe-top))] pb-[calc(var(--bottom-dock-height)+var(--safe-bottom))]">
      {/* Chapter Degraded Recovery Banner */}
      {failedPageIndices.size > 0 && (
        <div className="fixed top-[calc(var(--mobile-header-height)+var(--safe-top)+10px)] z-40 max-w-md w-[calc(100%-32px)] mx-auto left-0 right-0 p-3 rounded-full bg-surface-raised/95 backdrop-blur-xl border border-semantic-warning/30 shadow-lg flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-semantic-warning font-medium">
            <Warning size={18} weight="fill" className="shrink-0" />
            <span>{failedPageIndices.size} halaman gagal dimuat</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onRefreshChapter && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2.5 rounded-lg"
                onClick={async () => {
                  const fresh = await onRefreshChapter();
                  if (fresh) {
                    setFailedPageIndices(new Set());
                    toast.success("Halaman chapter disegarkan");
                  }
                }}
              >
                Segarkan
              </Button>
            )}
            {onOpenAlternateSource && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 rounded-lg border-semantic-warning/40 text-semantic-warning hover:bg-semantic-warning/10 font-bold"
                onClick={onOpenAlternateSource}
              >
                Ganti Sumber
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Tap Zones */}
      <button
        type="button"
        className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer opacity-0 focus:outline-none"
        aria-label={leftLabel}
        onClick={handleLeftTap}
      />
      <button
        type="button"
        className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer opacity-0 focus:outline-none"
        aria-label={rightLabel}
        onClick={handleRightTap}
      />
      <button
        type="button"
        className="absolute left-1/4 right-1/4 top-0 bottom-0 z-10 cursor-pointer opacity-0 focus:outline-none"
        aria-label="Toggle Overlay"
        onClick={toggleOverlay}
      />

      {/* Main Single Page Container */}
      {currentPage ? (
        <motion.div
          key={currentPageIndex}
          drag={canDrag ? "x" : false}
          onTouchStart={handleTouchStart}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0.9, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative max-w-full max-h-screen flex items-center justify-center z-0 px-2"
        >
          <ReaderImage
            pageIndex={currentPageIndex}
            pageUrl={currentUrl}
            isWebtoon={false}
            dataSaver={dataSaver}
            isAllowedToLoad={true}
            onReport={(idx) => handleReport(idx)}
            onSwitchSource={onOpenAlternateSource}
            onLoadComplete={() => handleImageLoad(currentPageIndex)}
            onError={() => {}}
            onPermanentFailure={handlePermanentFailure}
            onRefreshUrl={async () => {
              if (onRefreshChapter) {
                const freshPages = await onRefreshChapter();
                if (freshPages && freshPages[currentPageIndex]) {
                  return freshPages[currentPageIndex].url;
                }
              }
              return null;
            }}
          />
        </motion.div>
      ) : null}

      {/* Bottom Paged Navigation & Counter Squircle */}
      <div className="fixed bottom-[calc(var(--bottom-dock-height,80px)+16px)] z-30 flex items-center gap-2.5 px-3 py-1.5 bg-surface-raised/95 backdrop-blur-xl rounded-xl border border-border-subtle shadow-md text-xs font-semibold text-text-primary">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-text-secondary hover:text-text-primary"
          onClick={goToPrevPage}
          disabled={currentPageIndex === 0 && !prevChapterId}
          aria-label="Halaman sebelumnya"
        >
          <CaretLeft size={16} weight="bold" />
        </Button>

        <span className="tabular-nums font-bold">
          {currentPageIndex + 1} / {totalPages}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-text-secondary hover:text-text-primary"
          onClick={goToNextPage}
          disabled={currentPageIndex === totalPages - 1 && !nextChapterId}
          aria-label="Halaman berikutnya"
        >
          <CaretRight size={16} weight="bold" />
        </Button>
      </div>

      <ReportSheet
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        context="chapter"
        subject={chapterTitle}
        sourceId={sourceId}
        mangaId={mangaId}
        chapterId={chapterId}
        chapterTitle={chapterTitle}
        pageIndex={reportPageIndex}
      />
    </div>
  );
}
