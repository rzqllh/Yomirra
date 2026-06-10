import * as React from "react"
import { useReaderStore } from "@/shared/store/reader-store"
import { useHistoryStore } from "@/shared/store/history-store"
import { PageItem } from "@/shared/types/source"
import { cn } from "@/shared/utils/cn"
import { PageImageError } from "./page-image-error"

interface ContinuousVerticalReaderProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  pages: PageItem[];
}

export function ContinuousVerticalReader({ sourceId, mangaId, chapterId, pages }: ContinuousVerticalReaderProps) {
  const { settings, toggleOverlay } = useReaderStore()
  const markChapterProgress = useHistoryStore((state) => state.markChapterProgress)
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  
  const [errorPages, setErrorPages] = React.useState<Record<number, boolean>>({})

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
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={page.url}
                alt={`Page ${page.index}`}
                className={cn("w-full object-contain", !isWebtoon && "shadow-soft")}
                loading="lazy"
                onError={() => setErrorPages(prev => ({ ...prev, [page.index]: true }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
