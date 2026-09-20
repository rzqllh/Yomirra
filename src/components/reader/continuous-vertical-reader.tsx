import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useHistoryStore } from "@/shared/store/history-store"
import { useLibraryStore } from "@/shared/store/library-store"
import { PageItem } from "@/shared/types/source"
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes"
import { ReaderImage } from "./reader-image"
import { Chapter } from "@/shared/types/source"
import { useDownloadStore } from "@/shared/store/download-store"
import { getOfflineImageUrl } from "@/shared/utils/download-helpers"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { useReaderScroll } from "@/shared/hooks/use-reader-scroll"
import { getSourceMetadata } from "@/shared/sources/source-registry"

import { useReadingTimer } from "@/shared/hooks/use-reading-timer"
import { CaretLeft, CaretRight, CheckCircle, Flag, BookOpen, Warning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

export type StreamItem = { type: "image"; chapterId: string; pageIndex: number; url: string; index: number };

interface ContinuousVerticalReaderProps {
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

export function ContinuousVerticalReader({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle = "Chapter",
  pages,
  chapters: _chapters,
  prevChapterId: _prevChapterId,
  nextChapterId,
  onOpenAlternateSource,
  onRefreshChapter,
}: ContinuousVerticalReaderProps) {
  const router = useRouter()
  const preferences = useReaderStore(state => state.preferences)
  const { dataSaver } = useSettingsStore()
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId))
  const saveProgress = useHistoryStore(state => state.saveProgress)
  const getProgress = useHistoryStore(state => state.getLatestForManga)
  const hasHydrated = useHistoryStore(state => state._hasHydrated)
  const historyItem = useHistoryStore(state => {
    const id = `${sourceId}::${mangaId}::${chapterId}`;
    return state.items[id] || state.getLatestForManga(sourceId, mangaId);
  })
  const [isRestored, setIsRestored] = React.useState(false)
  const isInLibrary = useLibraryStore(state => state.isInLibrary(sourceId, mangaId))
  const addToLibrary = useLibraryStore(state => state.addToLibrary)
  const source = React.useMemo(() => getSourceMetadata(sourceId), [sourceId]);
  const reportUrl = source?.reportUrl;

  const queryClient = useQueryClient()

  useReadingTimer()

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

  const streamItems = React.useMemo<StreamItem[]>(() => {
    return currentPages.map(p => ({
      type: "image",
      chapterId: chapterId,
      pageIndex: p.index,
      url: p.url,
      index: p.index
    }));
  }, [currentPages, chapterId]);

  const cacheKey = `yomirra-virtualizer-cache-${sourceId}-${mangaId}-${chapterId}`;

  const initialCache = React.useMemo(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) { }
      }
    }
    return undefined;
  }, [cacheKey]);

  const virtualizer = useWindowVirtualizer({
    count: streamItems.length,
    estimateSize: () => 1200, // loose estimate for webtoons
    overscan: 3,
    initialOffset: 0,
    ...(initialCache ? { initialMeasurementsCache: initialCache } : {})
  });

  React.useEffect(() => {
    const saveCache = () => {
      if (typeof sessionStorage !== 'undefined') {
        const measurements = virtualizer.measurementsCache;
        if (measurements && measurements.length > 0) {
          sessionStorage.setItem(cacheKey, JSON.stringify(measurements));
        }
      }
    };

    window.addEventListener('beforeunload', saveCache);
    return () => {
      saveCache();
      window.removeEventListener('beforeunload', saveCache);
    };
  }, [virtualizer, cacheKey]);

  const virtualItems = virtualizer.getVirtualItems();

  const handleImageError = React.useCallback(() => { }, []);



  useReaderScroll({
    streamItems,
    virtualizer,
    sourceId,
    mangaId,
    chapterId,
    nextChapterId,
    saveProgress,
    queryClient,
    isReadyToTrack: isRestored,
  });

  React.useEffect(() => {
    if (isRestored) return;

    const isStoreReady =
      hasHydrated ||
      (useHistoryStore.persist?.hasHydrated ? useHistoryStore.persist.hasHydrated() : false) ||
      !!historyItem;

    if (!isStoreReady) return;

    const saved = historyItem;
    if (saved && saved.chapterId === chapterId && typeof saved.pageIndex === "number" && saved.pageIndex > 0) {
      const targetIndex = Math.min(saved.pageIndex, Math.max(0, streamItems.length - 1));

      virtualizer.scrollToIndex(targetIndex, { align: "start" });

      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(targetIndex, { align: "start" });
        setIsRestored(true);
      });

      toast(`Melanjutkan bacaan hal. ${targetIndex + 1}...`, {
        id: "resume-reading",
        position: "top-center",
        icon: <BookOpen size={15} weight="fill" className="text-accent shrink-0" />,
      });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      setIsRestored(true);
    }
  }, [hasHydrated, historyItem, chapterId, streamItems.length, virtualizer, isRestored]);

  const isWebtoon = true;

  // W3.7 Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === " " || e.code === "Space") {
        // Only handle if overlay isn't capturing it
        e.preventDefault();
        const scrollAmount = window.innerHeight * 0.9;
        window.scrollBy({
          top: e.shiftKey ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNextChapter = React.useCallback(() => {
    if (!nextChapterId) return;

    if (!isInLibrary) {
      const readCountKey = `yomirra-read-count-${mangaId}`;
      const currentCount = parseInt(sessionStorage.getItem(readCountKey) || "0");
      const newCount = currentCount + 1;
      sessionStorage.setItem(readCountKey, newCount.toString());

      if (newCount >= 3) {
        toast("Kamu sudah membaca 3 chapter dari komik ini. Simpan ke Bookmark?", {
          action: {
            label: "Bookmark",
            onClick: () => {
              const historyItem = getProgress(sourceId, mangaId);
              if (historyItem) {
                addToLibrary({
                  sourceId,
                  mangaId,
                  title: historyItem.mangaTitle,
                  coverUrl: historyItem.coverUrl,
                  addedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                toast.success("Berhasil ditambahkan ke Bookmark!");
              }
            }
          },
          duration: 8000,
        });
        sessionStorage.setItem(readCountKey, "0"); // Reset count
      }
    }

    router.replace(getReaderHref(sourceId, mangaId, nextChapterId));
  }, [nextChapterId, isInLibrary, mangaId, sourceId, getProgress, addToLibrary, router]);

  const handleReport = React.useCallback(() => {
    const subject = encodeURIComponent(`[Laporan Yomirra] ${chapterTitle} - ${mangaId}`);
    const body = encodeURIComponent(
      `Halo Hafizh,\n\nSaya menemukan kendala saat membaca di Yomirra:\n• Sumber: ${sourceId}\n• ID Komik: ${mangaId}\n• Bab: ${chapterTitle} (${chapterId})\n\nKendala:\n`
    );
    window.location.href = `mailto:hrizqullah484@gmail.com?subject=${subject}&body=${body}`;
  }, [chapterTitle, mangaId, sourceId, chapterId]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center select-none pb-12 bg-black/95 dark:bg-black">
      {/* Chapter Degraded Recovery Banner */}
      {failedPageIndices.size > 0 && (
        <div className="fixed top-[calc(var(--mobile-header-height)+var(--safe-top)+10px)] z-40 max-w-md w-[calc(100%-32px)] mx-auto left-0 right-0 p-3 rounded-2xl bg-surface-raised/95 backdrop-blur-xl border border-semantic-warning/30 shadow-lg flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
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

      <div
        className="flex w-full max-w-[800px] flex-col items-center pt-[calc(var(--mobile-header-height)+var(--safe-top))]"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
        suppressHydrationWarning
      >
        {virtualItems.map((virtualRow) => {
          const item = streamItems[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: preferences.pageGap === 'none' ? '0px' : preferences.pageGap === 'small' ? '4px' : '16px'
              }}
            >
              <ReaderImage
                pageIndex={item.pageIndex}
                pageUrl={item.url}
                isWebtoon={isWebtoon}
                dataSaver={dataSaver}
                isAllowedToLoad={true}
                onLoadComplete={() => handleImageLoad(item.pageIndex)}
                onError={handleImageError}
                onPermanentFailure={handlePermanentFailure}
                onRefreshUrl={async () => {
                  if (onRefreshChapter) {
                    const fresh = await onRefreshChapter();
                    if (fresh && fresh[item.pageIndex]) {
                      return fresh[item.pageIndex].url;
                    }
                  }
                  return null;
                }}
                priority={virtualRow.index === 0}
                offlineUrl={isDownloaded ? getOfflineImageUrl({ sourceId, mangaId, chapterId: item.chapterId, pageIndex: item.pageIndex }) : undefined}
                imageFit={preferences.imageFit}
                reportUrl={reportUrl}
                dataIndex={virtualRow.index}
                totalPages={pages.length}
              />
            </div>
          );
        })}
      </div>

      {/* Visual Transition Fader from Comic Pages to Black Canvas */}
      <div className="w-full max-w-[800px] h-14 bg-gradient-to-b from-transparent via-black/60 to-black pointer-events-none -mt-4 relative z-10" />

      {/* Hairline Gradient Transition Divider */}
      <div className="w-full max-w-[280px] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent my-2 relative z-10" />

      {/* End of Chapter Section (Combined Variant 3 Milestone + 10 Unified Dock on Pure Black Canvas) */}
      <div className="w-full max-w-[420px] mx-auto px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-4 relative z-10 select-none">
        {/* Ambient Glow behind Card Dock */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[200px] bg-accent/12 rounded-full blur-[80px] pointer-events-none -z-10" />

        {/* Milestone Card Dock */}
        <div className="w-full rounded-2xl bg-zinc-950/85 border border-white/[0.08] backdrop-blur-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative">
          {/* Header Status Line */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="size-2 rounded-full bg-semantic-success shrink-0" />
              <span className="text-xs font-semibold text-white/90 truncate">
                {chapterTitle} selesai
              </span>
            </div>
            <span className="text-[11px] font-mono text-white/70 shrink-0">
              {pages.length} halaman
            </span>
          </div>

          {/* Primary Navigation Buttons (Ergonomic h-11 Apple HIG, Reusable Squircle) */}
          <div className="flex items-center gap-2.5 w-full">
            {_prevChapterId && (
              <Button
                variant="outline"
                className="h-11 px-4 font-semibold text-xs sm:text-sm bg-white/[0.05] hover:bg-white/[0.10] active:bg-white/[0.08] border-white/10 text-white/80 hover:text-white flex-1 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-none"
                onClick={() => {
                  router.replace(getReaderHref(sourceId, mangaId, _prevChapterId));
                }}
              >
                <CaretLeft size={16} weight="bold" />
                <span>Sebelumnya</span>
              </Button>
            )}

            {nextChapterId ? (
              <Button
                className={cn(
                  "h-11 px-4 font-semibold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_24px_rgba(108,106,250,0.35)]",
                  _prevChapterId ? "flex-1" : "w-full"
                )}
                onClick={handleNextChapter}
              >
                <span>{_prevChapterId ? "Selanjutnya" : "Lanjut Bab Berikutnya"}</span>
                <CaretRight size={16} weight="bold" />
              </Button>
            ) : (
              <Button
                asChild
                className={cn(
                  "h-11 px-4 font-semibold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(108,106,250,0.35)]",
                  _prevChapterId ? "flex-1" : "w-full"
                )}
              >
                <Link href={getMangaDetailHref(sourceId, mangaId)} prefetch={false}>
                  <BookOpen size={16} weight="bold" />
                  <span>Detail Komik</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Utility Micro-actions */}
          <div className="flex items-center justify-center gap-3 text-xs text-white/70 pt-0.5">
            {nextChapterId && (
              <>
                <Link
                  href={getMangaDetailHref(sourceId, mangaId)}
                  prefetch={false}
                  className="hover:text-white/80 transition-colors flex items-center gap-1.5 py-1"
                >
                  <BookOpen size={13} />
                  <span>Detail Komik</span>
                </Link>
                <span className="text-white/20">·</span>
              </>
            )}

            <button
              type="button"
              onClick={handleReport}
              className="hover:text-semantic-error/90 transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <Flag size={13} />
              <span>Laporkan kendala</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
