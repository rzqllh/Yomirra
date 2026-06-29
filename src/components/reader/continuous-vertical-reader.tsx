import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useHistoryStore } from "@/shared/store/history-store"
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
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"

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
        toast("Melanjutkan bacaan...", { position: 'top-center' });
      }, 100);
    }
  }, [sourceId, mangaId, chapterId, getProgress, virtualizer])

  const isWebtoon = true;

  return (
    <div className="flex min-h-screen w-full flex-col items-center select-none pb-12">
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
      <div className="w-full max-w-xl mx-auto px-6 py-24 flex flex-col items-center gap-8 text-center mt-8 relative z-10">
        <div className={cn("w-16 h-1 rounded-full mb-2 opacity-50", preferences.background === 'mist' ? "bg-gray-300" : "bg-white/20")} />
        <div className="flex flex-col gap-2">
          <h3 className={cn("text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm", preferences.background === 'mist' ? "text-gray-900" : "text-white")}>Akhir dari {chapterTitle}</h3>
          <p className={cn("text-sm font-medium tracking-wide", preferences.background === 'mist' ? "text-gray-600" : "text-gray-400")}>Kamu telah menyelesaikan chapter ini.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full gap-4 mt-4">
          <Button
            variant="outline"
            className={cn(
              "flex-1 rounded-2xl py-7 font-bold text-[15px] backdrop-blur-md shadow-sm transition-all active:scale-[0.98]",
              preferences.background === 'mist' 
                ? "bg-black/5 hover:bg-black/10 border-black/10 text-gray-700" 
                : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
            )}
            onClick={() => router.push(getMangaDetailHref(sourceId, mangaId))}
          >
            <CaretLeft size={20} className="mr-2 opacity-70" weight="bold" />
            Detail Manga
          </Button>
          
          {nextChapterId ? (
            <Button
              className="flex-1 rounded-2xl py-7 font-bold text-[15px] bg-accent/90 text-white hover:bg-accent active:scale-[0.98] shadow-lg shadow-accent/20 border border-accent/20 transition-all"
              onClick={() => router.push(getReaderHref(sourceId, mangaId, nextChapterId))}
            >
              Chapter Berikutnya
              <CaretRight size={20} className="ml-2 opacity-90" weight="bold" />
            </Button>
          ) : (
            <Button
              disabled
              className={cn(
                "flex-1 rounded-2xl py-7 font-bold text-[15px] cursor-not-allowed border border-transparent",
                preferences.background === 'mist' ? "bg-gray-200 text-gray-400" : "bg-white/10 text-gray-500"
              )}
            >
              Mentok Raw
            </Button>
          )}
        </div>
      </div>
      
      {/* End of Stream observer for triggering next chapter load */}
      <div ref={endRef} className="w-full h-1" />
    </div>
  )
}
