import * as React from "react"
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
import { useDecodeQueue } from "@/shared/hooks/use-decode-queue"
import { useReadingTimer } from "@/shared/hooks/use-reading-timer"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

export type StreamItem = 
  | { type: "image"; chapterId: string; pageIndex: number; url: string; index: number }
  | { type: "divider"; chapterId: string; chapterTitle: string };

interface ContinuousVerticalReaderProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterTitle?: string;
  pages: PageItem[];
  chapters?: Chapter[];
  prevChapterId?: string;
  nextChapterId?: string;
}

export function ContinuousVerticalReader({ 
  sourceId, 
  mangaId, 
  chapterId,
  chapterTitle = "Chapter",
  pages,
  chapters: _chapters,
  prevChapterId: _prevChapterId,
  nextChapterId
}: ContinuousVerticalReaderProps) {
  const router = useRouter()
  const preferences = useReaderStore(state => state.preferences)
  const { dataSaver } = useSettingsStore()
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId))
  const saveProgress = useHistoryStore(state => state.saveProgress)
  const getProgress = useHistoryStore(state => state.getLatestForManga)
  const isInLibrary = useLibraryStore(state => state.isInLibrary(sourceId, mangaId))
  const addToLibrary = useLibraryStore(state => state.addToLibrary)
  
  const queryClient = useQueryClient()
  const decodeQueue = useDecodeQueue(3)
  
  useReadingTimer()

  const streamItems = React.useMemo<StreamItem[]>(() => {
    return pages.map(p => ({
      type: "image",
      chapterId: chapterId,
      pageIndex: p.index,
      url: p.url,
      index: p.index
    }));
  }, [pages, chapterId]);

  const cacheKey = `yomirra-virtualizer-cache-${sourceId}-${mangaId}-${chapterId}`;
  
  const initialCache = React.useMemo(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
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

  const handleImageLoad = React.useCallback(() => {}, [])
  const handleImageError = React.useCallback(() => {}, [])

  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const endObserver = new IntersectionObserver(([entry]) => {}, { threshold: 0.1 })
    if (endRef.current) {
      endObserver.observe(endRef.current)
    }
    return () => endObserver.disconnect()
  }, [])

  useReaderScroll({
    streamItems,
    virtualizer,
    sourceId,
    mangaId,
    chapterId,
    nextChapterId,
    saveProgress,
    queryClient,
  });

  React.useLayoutEffect(() => {
    const saved = getProgress(sourceId, mangaId)
    if (saved && saved.chapterId === chapterId && saved.pageIndex !== undefined) {
      setTimeout(() => {
        virtualizer.scrollToIndex(saved.pageIndex!, { align: 'start' });
        toast("Melanjutkan bacaan...", { id: 'resume-reading', position: 'top-center' });
      }, 100);
    }
  }, [sourceId, mangaId, chapterId, getProgress, virtualizer])

  const isWebtoon = true;

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
    
    router.push(getReaderHref(sourceId, mangaId, nextChapterId));
  }, [nextChapterId, isInLibrary, mangaId, sourceId, getProgress, addToLibrary, router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center select-none pb-12 bg-black/95 dark:bg-black">
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
              {item.type === 'image' ? (
                <ReaderImage 
                  pageIndex={item.pageIndex}
                  pageUrl={item.url}
                  isWebtoon={isWebtoon}
                  dataSaver={dataSaver}
                  isAllowedToLoad={true}
                  onLoadComplete={handleImageLoad}
                  onError={handleImageError}
                  priority={virtualRow.index === 0}
                  offlineUrl={isDownloaded ? getOfflineImageUrl({ sourceId, mangaId, chapterId: item.chapterId, pageIndex: item.pageIndex }) : undefined}
                  imageFit={preferences.imageFit}
                  decodeQueue={decodeQueue}
                  dataIndex={virtualRow.index}
                  totalPages={pages.length}
                />
              ) : (
                <div className="w-full py-12 flex justify-center items-center text-text-muted text-sm tracking-widest uppercase">
                  {item.chapterTitle}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* End of Chapter Section */}
      <div className="w-full max-w-[800px] mx-auto px-4 py-8 flex flex-col gap-4 mt-8 relative z-10 bg-background/50 backdrop-blur-sm sm:bg-transparent">
        <div className="flex items-center justify-between gap-4 w-full">
          <Button
            variant="outline"
            className={cn(
              "flex-1 rounded-md py-6 font-semibold bg-surface-base hover:bg-surface-raised border-border-subtle",
              !_prevChapterId && "invisible"
            )}
            onClick={() => _prevChapterId && router.push(getReaderHref(sourceId, mangaId, _prevChapterId))}
          >
            <CaretLeft size={16} className="mr-2" /> Previous
          </Button>

          <Button
            variant="ghost"
            className="rounded-md py-6 font-semibold px-4 text-text-muted hover:text-text-primary hover:bg-surface-raised"
            onClick={() => window.open('https://discord.gg/shinigamid', '_blank')}
          >
            Report Chapter
          </Button>
          
          <Button
            variant="outline"
            className={cn(
              "flex-1 rounded-md py-6 font-semibold bg-surface-base hover:bg-surface-raised border-border-subtle",
              !nextChapterId && "invisible"
            )}
            onClick={handleNextChapter}
          >
            Next <CaretRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
      
      {/* End of Stream observer for triggering next chapter load */}
      <div ref={endRef} className="w-full h-1" />
    </div>
  )
}
