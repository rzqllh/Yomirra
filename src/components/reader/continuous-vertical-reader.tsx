import * as React from "react"
import { useReaderStore } from "@/shared/store/reader-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useHistoryStore } from "@/shared/store/history-store"
import { PageItem } from "@/shared/types/source"
import { getReaderHref } from "@/shared/lib/routes"
import { ReaderImage } from "./reader-image"
import { Chapter } from "@/shared/types/source"
import { useDownloadStore } from "@/shared/store/download-store"
import { getOfflineImageUrl } from "@/shared/utils/download-helpers"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { useReaderScroll } from "@/shared/hooks/use-reader-scroll"
import { useDecodeQueue } from "@/shared/hooks/use-decode-queue"

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
  chapterTitle: _chapterTitle = "Chapter",
  pages,
  chapters: _chapters,
  prevChapterId: _prevChapterId,
  nextChapterId
}: ContinuousVerticalReaderProps) {
  const { preferences } = useReaderStore()
  const { dataSaver } = useSettingsStore()
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId))
  const saveProgress = useHistoryStore(state => state.saveProgress)
  const getProgress = useHistoryStore(state => state.getLatestForManga)


  
  const queryClient = useQueryClient()
  const decodeQueue = useDecodeQueue(3)
  
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
          // TanStack Virtual 3 uses an array of measurements
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
    // Note: TanStack Virtual 3 uses `initialMeasurementsCache` to restore
    ...(initialCache ? { initialMeasurementsCache: initialCache } : {})
  });

  // Save measurements cache when virtualItems change or on unmount
  React.useEffect(() => {
    // We can't directly subscribe to measurement cache updates, so we save it periodically or on unmount
    const saveCache = () => {
      if (typeof sessionStorage !== 'undefined') {
        // We can access the internal measurements
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

  const handleImageLoad = React.useCallback(() => {
    // No-op for now, progressive measurement handles heights
  }, [])

  const handleImageError = React.useCallback(() => {
    // No-op
  }, [])

  // End of chapter observer
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const endObserver = new IntersectionObserver(([entry]) => {
      // Unused isEndVisible 
    }, { threshold: 0.1 })
    
    if (endRef.current) {
      endObserver.observe(endRef.current)
    }
    return () => endObserver.disconnect()
  }, [])

  // URL Throttling and Progress Saving handled by useReaderScroll
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

  // Restore scroll position
  React.useLayoutEffect(() => {
    const saved = getProgress(sourceId, mangaId)
    if (saved && saved.chapterId === chapterId && saved.pageIndex !== undefined) {
      // Small timeout to allow virtualizer to mount
      setTimeout(() => {
        virtualizer.scrollToIndex(saved.pageIndex!, { align: 'start' });
        toast("Melanjutkan bacaan...", { position: 'top-center' });
      }, 100);
    }
  }, [sourceId, mangaId, chapterId, getProgress, virtualizer])

  const isWebtoon = true;

  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center py-8 select-none"
    >
      <div 
        className="flex w-full flex-col items-center pt-[calc(var(--mobile-header-height)+var(--safe-top))]"
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
                // Add gap based on preferences
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
      
      {/* End of Stream observer for triggering next chapter load */}
      <div ref={endRef} className="w-full h-1" />
    </div>
  )
}
