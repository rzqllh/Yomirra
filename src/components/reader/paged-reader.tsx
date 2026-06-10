import * as React from "react"
import { useReaderStore } from "@/shared/store/reader-store"
import { useHistoryStore } from "@/shared/store/history-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { PageItem } from "@/shared/types/source"
import { PageImageError } from "./page-image-error"
import Image from "next/image"

interface PagedReaderProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  pages: PageItem[];
}

export function PagedReader({ sourceId, mangaId, chapterId, pages }: PagedReaderProps) {
  const { settings, toggleOverlay } = useReaderStore()
  const { dataSaver } = useSettingsStore()
  const markChapterProgress = useHistoryStore((state) => state.markChapterProgress)
  
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0)
  const [imageError, setImageError] = React.useState(false)

  // Sync progress
  React.useEffect(() => {
    if (pages.length > 0) {
      markChapterProgress(sourceId, mangaId, chapterId, currentPageIndex + 1, pages.length)
    }
  }, [currentPageIndex, sourceId, mangaId, chapterId, pages.length, markChapterProgress])

  // Safe Preload
  React.useEffect(() => {
    if (currentPageIndex < pages.length - 1) {
      const nextImg = new window.Image()
      nextImg.src = pages[currentPageIndex + 1].url
    }
  }, [currentPageIndex, pages])

  const next = React.useCallback(() => {
    setCurrentPageIndex(p => {
      const nextP = Math.min(pages.length - 1, p + 1)
      if (p !== nextP) setImageError(false)
      return nextP
    })
  }, [pages.length])

  const prev = React.useCallback(() => {
    setCurrentPageIndex(p => {
      const prevP = Math.max(0, p - 1)
      if (p !== prevP) setImageError(false)
      return prevP
    })
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isRTL = settings.direction === "RTL"
      
      if (e.key === "ArrowRight") {
        if (isRTL) {
          prev()
        } else {
          next()
        }
      } else if (e.key === "ArrowLeft") {
        if (isRTL) {
          next()
        } else {
          prev()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [settings.direction, next, prev])

  // Tap zones navigation
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const isRTL = settings.direction === "RTL"

    if (x < width * 0.3) {
      // Left 30%
      if (isRTL) {
        next()
      } else {
        prev()
      }
    } else if (x > width * 0.7) {
      // Right 30%
      if (isRTL) {
        prev()
      } else {
        next()
      }
    } else {
      // Center 40%
      toggleOverlay()
    }
  }

  if (pages.length === 0) return null

  const currentPage = pages[currentPageIndex]

  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center justify-center py-8 select-none overflow-hidden bg-background"
      onClick={handleTap}
      style={{ cursor: 'pointer' }}
    >
      <div 
        className="flex w-full items-center justify-center relative h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"
        style={{ maxWidth: settings.maxWidth ? `${settings.maxWidth}px` : '100%' }}
      >
        {imageError ? (
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <PageImageError index={currentPage.index} onRetry={() => setImageError(false)} />
          </div>
        ) : (
          <Image 
            key={currentPage.url}
            src={currentPage.url}
            alt={`Page ${currentPage.index}`}
            width={800}
            height={1200}
            quality={dataSaver ? 60 : 85}
            unoptimized={!dataSaver}
            className="object-contain shadow-soft pointer-events-none max-h-full max-w-full"
            priority
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Page indicator (Overlay independent) */}
      <div className="fixed bottom-4 right-4 md:right-[calc(320px+1rem)] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-white tracking-widest z-40 pointer-events-none transition-all">
        {currentPageIndex + 1} / {pages.length}
      </div>
    </div>
  )
}
