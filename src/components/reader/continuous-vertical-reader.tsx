import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeft, CaretRight, List } from "@phosphor-icons/react"
import { useReaderStore } from "@/shared/store/reader-store"
import { useHistoryStore } from "@/shared/store/history-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { PageItem } from "@/shared/types/source"
import { cn } from "@/shared/utils/cn"
import { getReaderHref } from "@/shared/lib/routes"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { PageImageError } from "./page-image-error"
import Image from "next/image"
import { EndOfChapter } from "./end-of-chapter"
import { ReaderChapterDrawer } from "./reader-chapter-drawer"
import { Chapter } from "@/shared/types/source"

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
  const { settings, toggleOverlay, isOverlayVisible, setOverlayVisible } = useReaderStore()
  const { dataSaver } = useSettingsStore()
  const markChapterProgress = useHistoryStore((state) => state.markChapterProgress)
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  
  const [errorPages, setErrorPages] = React.useState<Record<number, boolean>>({})
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = React.useState(false)

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

  // Auto-hide scroll listener
  React.useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

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
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [setOverlayVisible])

  const handleRetry = (index: number) => {
    setErrorPages(prev => ({ ...prev, [index]: false }))
  }

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

  const isWebtoon = settings.mode === "WEBTOON"

  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center py-8 select-none"
      onClick={toggleOverlay}
    >
      <div 
        className={cn(
          "flex w-full flex-col items-center pt-[calc(56px+env(safe-area-inset-top))]",
          isWebtoon ? "gap-0" : "gap-4"
        )}
        style={{ maxWidth: settings.maxWidth ? `${settings.maxWidth}px` : '100%' }}
      >
        {pages.map((page) => (
          <div 
            key={`${page.index}-${errorPages[page.index] ? 'error' : 'ok'}`} 
            className="reader-page-container w-full flex justify-center bg-surface-raised/30 min-h-[50vh]"
            data-page-index={page.index}
          >
            {errorPages[page.index] ? (
              <div className="w-full flex items-center justify-center p-4">
                <PageImageError index={page.index} onRetry={() => handleRetry(page.index)} />
              </div>
            ) : (
              <Image 
                src={page.url}
                alt={`Page ${page.index}`}
                className={cn(
                  "w-full object-contain", 
                  !isWebtoon && "shadow-soft",
                  // Fade in image if reduced motion is false
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
                )}
                width={800}
                height={1200}
                sizes="100vw"
                quality={dataSaver ? 60 : 85}
                unoptimized={!dataSaver}
                priority={page.index <= 1}
                style={{ width: "100%", height: "auto" }}
                onError={() => setErrorPages(prev => ({ ...prev, [page.index]: true }))}
              />
            )}
          </div>
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
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 md:hidden",
          isOverlayVisible && !isEndVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 bg-surface-base/85 backdrop-blur-xl border border-border-subtle rounded-full p-1.5 shadow-xl">
          <IconButton 
            aria-label="Chapter sebelumnya"
            variant="ghost"
            className={cn("rounded-full", !prevChapterId && "opacity-50 cursor-not-allowed")}
            disabled={!prevChapterId}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (prevChapterId) router.push(getReaderHref(sourceId, mangaId, prevChapterId)) 
            }}
          >
            <CaretLeft size={20} weight="bold" />
          </IconButton>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full px-4 font-bold text-[13px] bg-surface-raised/50"
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
            className={cn("rounded-full", !nextChapterId && "opacity-50 cursor-not-allowed")}
            disabled={!nextChapterId}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (nextChapterId) router.push(getReaderHref(sourceId, mangaId, nextChapterId)) 
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
