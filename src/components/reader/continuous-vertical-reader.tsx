import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeft, CaretRight, List } from "@phosphor-icons/react"
import { useReaderStore } from "@/shared/store/reader-store"
import { useHistoryStore } from "@/shared/store/history-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useReaderProgressStore } from "@/shared/store/reader-progress-store"
import { PageItem } from "@/shared/types/source"
import { cn } from "@/shared/utils/cn"
import { getReaderHref } from "@/shared/lib/routes"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { SubtleChapterDivider } from "./subtle-chapter-divider"
import { ReaderImage } from "./reader-image"
import { ReaderChapterDrawer } from "./reader-chapter-drawer"
import { Chapter } from "@/shared/types/source"
import { useDownloadStore } from "@/shared/store/download-store"
import { getOfflineImageUrl } from "@/shared/utils/download-helpers"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useWindowVirtualizer } from "@tanstack/react-virtual"

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
  chapters,
  prevChapterId,
  nextChapterId
}: ContinuousVerticalReaderProps) {
  const { preferences, isOverlayVisible, isDesktopPanelOpen } = useReaderStore()
  const { dataSaver } = useSettingsStore()
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId))
  const saveProgress = useReaderProgressStore(state => state.saveProgress)
  const getProgress = useReaderProgressStore(state => state.getProgress)

  const router = useRouter()
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = React.useState(false)
  
  const queryClient = useQueryClient()
  
  const streamItems = React.useMemo<StreamItem[]>(() => {
    return pages.map(p => ({
      type: "image",
      chapterId: chapterId,
      pageIndex: p.index,
      url: p.url,
      index: p.index
    }));
  }, [pages, chapterId]);

  const virtualizer = useWindowVirtualizer({
    count: streamItems.length,
    estimateSize: () => 800, // loose estimate for webtoons
    overscan: 3,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handleImageLoad = React.useCallback(() => {
    // No-op for now, progressive measurement handles heights
  }, [])

  const handleImageError = React.useCallback(() => {
    // No-op
  }, [])

  // End of chapter observer
  const endRef = React.useRef<HTMLDivElement>(null)
  const [isEndVisible, setIsEndVisible] = React.useState(false)

  React.useEffect(() => {
    const endObserver = new IntersectionObserver(([entry]) => {
      setIsEndVisible(entry.isIntersecting)
    }, { threshold: 0.1 })
    
    if (endRef.current) {
      endObserver.observe(endRef.current)
    }
    return () => endObserver.disconnect()
  }, [])

  // URL Throttling and Progress Saving
  const lastActiveChapter = React.useRef(chapterId)
  
  React.useEffect(() => {
    let ticking = false
    let lastSaveTime = 0
    let hasPrefetched = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight
          
          // Preload trigger (~2 viewport heights before end)
          if (!hasPrefetched && nextChapterId && navigator.onLine) {
            if (maxScroll > 0 && currentScrollY >= maxScroll - (window.innerHeight * 2)) {
              hasPrefetched = true
              import("@/shared/api-client").then(m => {
                queryClient.prefetchQuery({
                  queryKey: ["chapter", sourceId, mangaId, nextChapterId],
                  queryFn: () => m.apiClient.getPages(sourceId, mangaId, nextChapterId)
                })
              })
            }
          }

          // Identify active item for URL replacing and progress
          const virtualItems = virtualizer.getVirtualItems();
          if (virtualItems.length > 0) {
            const centerItem = virtualItems.find(
              (item) => item.start <= currentScrollY + window.innerHeight / 2 && item.end >= currentScrollY + window.innerHeight / 2
            ) || virtualItems[0];
            
            const activeStreamItem = streamItems[centerItem.index];
            
            if (activeStreamItem.type === 'image') {
              // Save Progress (debounced)
              const now = Date.now()
              if (now - lastSaveTime > 250) {
                const offset = currentScrollY - centerItem.start;
                saveProgress(sourceId, mangaId, activeStreamItem.chapterId, activeStreamItem.pageIndex, offset)
                lastSaveTime = now
              }

              // Update URL if chapter crossed
              if (activeStreamItem.chapterId !== lastActiveChapter.current) {
                lastActiveChapter.current = activeStreamItem.chapterId;
                window.history.replaceState(null, '', getReaderHref(sourceId, mangaId, activeStreamItem.chapterId));
              }
            }
          }
          
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [sourceId, mangaId, nextChapterId, saveProgress, queryClient, streamItems, virtualizer])

  // Restore scroll position
  React.useLayoutEffect(() => {
    const saved = getProgress(sourceId, mangaId)
    if (saved && saved.chapterId === chapterId && saved.pageIndex !== undefined) {
      // Small timeout to allow virtualizer to mount
      setTimeout(() => {
        virtualizer.scrollToIndex(saved.pageIndex, { align: 'start' });
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
      >
        {virtualItems.map((virtualRow) => {
          const item = streamItems[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
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
                  measureElement={virtualizer.measureElement}
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

      {/* Floating Bottom Control */}
      <div 
        className={cn(
          "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] -translate-x-1/2 z-[var(--z-sticky)] transition-[transform,opacity] duration-150 pointer-events-none",
          isOverlayVisible && !isEndVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0",
          isDesktopPanelOpen ? "md:left-[calc(50%-160px)] left-1/2" : "left-1/2"
        )}
      >
        <div className="flex items-center gap-2 bg-black/20 dark:bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-md pointer-events-auto">
          <IconButton 
            aria-label="Chapter sebelumnya"
            variant="ghost"
            className={cn("rounded-full min-h-[44px] min-w-[44px] text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md", !prevChapterId && "opacity-50 cursor-not-allowed")}
            disabled={!prevChapterId}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (prevChapterId) {
                toast.info("Membuka chapter sebelumnya...", { duration: 2000 });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => router.push(getReaderHref(sourceId, mangaId, prevChapterId)), 150);
              }
            }}
          >
            <CaretLeft size={20} weight="bold" />
          </IconButton>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full px-4 min-h-[44px] font-bold text-sm bg-white/10 dark:bg-surface-raised/50 text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md"
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsChapterDrawerOpen(true);
            }}
          >
            <List size={16} weight="bold" className="mr-2" />
            Chapter
          </Button>

          <IconButton 
            aria-label="Chapter selanjutnya"
            variant="ghost"
            className={cn("rounded-full min-h-[44px] min-w-[44px] text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md", !nextChapterId && "opacity-50 cursor-not-allowed")}
            disabled={!nextChapterId}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (nextChapterId) {
                toast.info("Membuka chapter selanjutnya...", { duration: 2000 });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => router.push(getReaderHref(sourceId, mangaId, nextChapterId)), 150);
              }
            }}
          >
            <CaretRight size={20} weight="bold" />
          </IconButton>
        </div>
      </div>

      <ReaderChapterDrawer 
        isOpen={isChapterDrawerOpen}
        onClose={() => setIsChapterDrawerOpen(false)}
        chapters={chapters}
        currentChapterId={chapterId}
        sourceId={sourceId}
        mangaId={mangaId}
      />
    </div>
  )
}
