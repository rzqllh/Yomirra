"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { motion, PanInfo } from "motion/react";

interface PagedReaderProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterTitle?: string;
  pages: PageItem[];
  chapters?: Chapter[];
  prevChapterId?: string;
  nextChapterId?: string;
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
}: PagedReaderProps) {
  const router = useRouter();
  const preferences = useReaderStore(state => state.preferences);
  const toggleOverlay = useReaderStore(state => state.toggleOverlay);
  const { dataSaver } = useSettingsStore();
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId));
  const saveProgress = useHistoryStore(state => state.saveProgress);
  const getProgress = useHistoryStore(state => state.getLatestForManga);
  const source = React.useMemo(() => getSourceMetadata(sourceId), [sourceId]);
  const reportUrl = source?.reportUrl;

  useReadingTimer();

  // Initialize active page from history or 0
  const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(() => {
    const saved = getProgress(sourceId, mangaId);
    if (saved && saved.chapterId === chapterId && typeof saved.pageIndex === "number") {
      return Math.max(0, Math.min(saved.pageIndex, pages.length - 1));
    }
    return 0;
  });

  const totalPages = pages.length;
  const isRtl = preferences.readingDirection === "rtl";

  // Clamp page index when pages prop changes
  React.useEffect(() => {
    setCurrentPageIndex(prev => Math.max(0, Math.min(prev, pages.length - 1)));
  }, [pages.length]);

  // Persist page progress
  const flushProgress = React.useCallback(() => {
    if (totalPages > 0) {
      saveProgress(sourceId, mangaId, chapterId, currentPageIndex, totalPages);
    }
  }, [currentPageIndex, totalPages, sourceId, mangaId, chapterId, saveProgress]);

  React.useEffect(() => {
    flushProgress();
  }, [flushProgress]);

  useVisibilityFlush(flushProgress);

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

  // Touch Swipe Handler
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 40;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

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

  const currentPage = pages[currentPageIndex];
  const currentUrl = isDownloaded
    ? getOfflineImageUrl({ sourceId, mangaId, chapterId, pageIndex: currentPage?.index ?? currentPageIndex })
    : currentPage?.url ?? "";

  const leftLabel = isRtl ? "Area ketuk halaman berikutnya" : "Area ketuk halaman sebelumnya";
  const rightLabel = isRtl ? "Area ketuk halaman sebelumnya" : "Area ketuk halaman berikutnya";

  return (
    <div className="relative min-h-screen w-full bg-surface-base select-none flex flex-col items-center justify-center pt-[calc(var(--mobile-header-height)+var(--safe-top))] pb-[calc(var(--bottom-dock-height)+var(--safe-bottom))]">
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
          drag="x"
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
            reportUrl={reportUrl}
            onLoadComplete={() => {}}
            onError={() => {}}
          />
        </motion.div>
      ) : null}

      {/* Bottom Paged Navigation & Counter Pill */}
      <div className="fixed bottom-[calc(var(--bottom-dock-height,80px)+16px)] z-30 flex items-center gap-3 px-3 py-1.5 bg-surface-raised/90 backdrop-blur-md rounded-full border border-border-subtle shadow-md text-xs font-semibold text-text-primary">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-full text-text-secondary hover:text-text-primary"
          onClick={goToPrevPage}
          disabled={currentPageIndex === 0 && !prevChapterId}
          aria-label="Halaman sebelumnya"
        >
          <CaretLeft size={16} weight="bold" />
        </Button>

        <span className="tabular-nums">
          {currentPageIndex + 1} / {totalPages}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-full text-text-secondary hover:text-text-primary"
          onClick={goToNextPage}
          disabled={currentPageIndex === totalPages - 1 && !nextChapterId}
          aria-label="Halaman berikutnya"
        >
          <CaretRight size={16} weight="bold" />
        </Button>
      </div>
    </div>
  );
}
