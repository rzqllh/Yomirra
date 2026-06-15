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
import { EndOfChapter } from "./end-of-chapter"
import { ReaderImage } from "./reader-image"
import { ReaderChapterDrawer } from "./reader-chapter-drawer"
import { Chapter } from "@/shared/types/source"
import { useDownloadStore } from "@/shared/store/download-store"
import { getOfflineImageUrl } from "@/shared/utils/download-helpers"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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
  const router = useRouter()
  const { preferences, toggleOverlay, isOverlayVisible, setOverlayVisible, isDesktopPanelOpen } = useReaderStore()
  const { dataSaver } = useSettingsStore()
  const markChapterProgress = useHistoryStore((state) => state.markChapterProgress)
  const isDownloaded = useDownloadStore(state => state.isDownloaded(sourceId, mangaId, chapterId))
  const saveProgress = useReaderProgressStore(state => state.saveProgress)
  const getProgress = useReaderProgressStore(state => state.getProgress)
  const queryClient = useQueryClient()
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = React.useState(false)
  const [firstUnloadedIndex, setFirstUnloadedIndex] = React.useState(0)
  const loadedPagesRef = React.useRef<Set<number>>(new Set())

  const advancePreloader = React.useCallback(() => {
    setFirstUnloadedIndex(prev => {
      let i = prev;
      while (loadedPagesRef.current.has(i)) {
        i++;
      }
      return i;
    });
  }, [])

  const handleImageLoad = React.useCallback((index: number) => {
    loadedPagesRef.current.add(index)
    advancePreloader()
  }, [advancePreloader])

  const handleImageError = React.useCallback((index: number) => {
    // If it fails, we still want to proceed to the next one, otherwise the queue gets stuck
    loadedPagesRef.current.add(index)
    advancePreloader()
  }, [advancePreloader])

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

  // Auto-hide scroll listener & Progress saving & Preloading
  React.useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false
    let lastSaveTime = 0
    let hasPrefetched = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          // Trigger hide/show based on scroll direction
          if (currentScrollY > lastScrollY + 15) {
            setOverlayVisible(false)
          } else if (currentScrollY < lastScrollY - 15) {
            setOverlayVisible(true)
          }
          lastScrollY = currentScrollY

          // Save progress
          const now = Date.now()
          if (now - lastSaveTime > 250) {
            saveProgress(sourceId, mangaId, chapterId, currentScrollY, 0)
            lastSaveTime = now
          }

          // Preload next chapter
          if (!hasPrefetched && nextChapterId && navigator.onLine) {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight
            if (maxScroll > 0 && currentScrollY / maxScroll >= 0.8) {
              hasPrefetched = true
              import("@/shared/api-client").then(m => {
                queryClient.prefetchQuery({
                  queryKey: ["chapter", sourceId, mangaId, nextChapterId],
                  queryFn: () => m.apiClient.getPages(sourceId, mangaId, nextChapterId)
                })
              })
            }
          }

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [setOverlayVisible, sourceId, mangaId, chapterId, nextChapterId, saveProgress, queryClient])

  // Restore scroll position
  React.useEffect(() => {
    const saved = getProgress(sourceId, mangaId, chapterId)
    if (saved && saved.scrollY > 0) {
      window.scrollTo({ top: saved.scrollY, behavior: 'instant' })
      toast("Melanjutkan bacaan...", { position: 'top-center' })
    }
  }, [sourceId, mangaId, chapterId, getProgress])

  // Auto-hide scroll listener
  React.useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(e => e.isIntersecting)
      if (visibleEntries.length === 0) return

      const bestEntry = visibleEntries.reduce((prev, curr) => {
        return curr.intersectionRatio > prev.intersectionRatio ? curr : prev
      })

      if (bestEntry.intersectionRatio > 0.1) {
        const pageIndex = Number(bestEntry.target.getAttribute("data-page-index"))
        if (!isNaN(pageIndex)) {
          markChapterProgress(sourceId, mangaId, chapterId, pageIndex, pages.length)
        }
      }
    }, {
      root: null,
      rootMargin: "0px",
      threshold: [0.1, 0.5, 0.9],
    })

    const images = document.querySelectorAll(".reader-page-container")
    images.forEach(img => observerRef.current?.observe(img))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [sourceId, mangaId, chapterId, pages.length, markChapterProgress])

  const isWebtoon = true;

  const pointerState = React.useRef({ startX: 0, startY: 0, time: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore middle/right clicks
    if (e.button !== 0) return;
    pointerState.current = {
      startX: e.clientX,
      startY: e.clientY,
      time: Date.now()
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const { startX, startY, time } = pointerState.current
    const duration = Date.now() - time
    
    if (duration < 150 && Math.abs(e.clientX - startX) < 5 && Math.abs(e.clientY - startY) < 5) {
      toggleOverlay()
    }
  }

  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center py-8 select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div 
        className="flex w-full flex-col items-center pt-[calc(var(--mobile-header-height)+var(--safe-top))]"
        style={{ 
          gap: preferences.pageGap === 'none' ? '0px' : preferences.pageGap === 'small' ? '4px' : '16px'
        }}
      >
        {pages.map((page) => (
          <ReaderImage 
            key={page.index}
            page={page}
            isWebtoon={isWebtoon}
            dataSaver={dataSaver}
            isAllowedToLoad={page.index <= firstUnloadedIndex + (preferences.preloadIntensity === 'aggressive' ? 5 : preferences.preloadIntensity === 'balanced' ? 3 : 2)}
            onLoadComplete={handleImageLoad}
            onError={handleImageError}
            priority={page.index === 0}
            offlineUrl={isDownloaded ? getOfflineImageUrl({ sourceId, mangaId, chapterId, pageIndex: page.index }) : undefined}
            imageFit={preferences.imageFit}
          />
        ))}
        
        {/* End of Chapter */}
        <div ref={endRef} className="w-full mt-8" onClick={(e) => e.stopPropagation()}>
          <EndOfChapter 
            sourceId={sourceId}
            mangaId={mangaId}
            chapterTitle={chapterTitle}
            prevChapterId={prevChapterId}
            nextChapterId={nextChapterId}
          />
        </div>
      </div>

      {/* Floating Bottom Control */}
      <div 
        className={cn(
          "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] -translate-x-1/2 z-[var(--z-sticky)] transition-all duration-300 pointer-events-none",
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
