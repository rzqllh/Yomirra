"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"
import { PageItem } from "@/shared/types/source"
import { PageImageError } from "./page-image-error"

interface ReaderImageProps {
  page: PageItem
  isWebtoon: boolean
  dataSaver: boolean
  isAllowedToLoad: boolean
  onLoadComplete: (index: number) => void
  onError: (index: number) => void
  priority?: boolean
  offlineUrl?: string
  imageFit?: 'width' | 'contained'
}

export function ReaderImage({
  page,
  isWebtoon,
  dataSaver,
  isAllowedToLoad,
  onLoadComplete,
  onError,
  priority = false,
  offlineUrl,
  imageFit = 'width'
}: ReaderImageProps) {
  const [inView, setInView] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Intersection Observer to detect if user scrolled to this image
  // If they did, we force load it even if it's not its "turn" yet
  React.useEffect(() => {
    if (inView) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { rootMargin: "1000px" }) // Generous 1000px margin

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [inView])

  const shouldLoad = isAllowedToLoad || inView

  const handleRetry = () => {
    setHasError(false)
  }

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "reader-page-container w-full flex justify-center",
        (!shouldLoad || hasError) && "min-h-[50vh] bg-surface-muted/30"
      )}
      data-page-index={page.index}
    >
      {hasError ? (
        <div className="w-full flex items-center justify-center p-4">
          <PageImageError index={page.index} onRetry={handleRetry} />
        </div>
      ) : shouldLoad ? (
        <Image 
          src={offlineUrl || page.url}
          alt={`Page ${page.index}`}
          className={cn(
            "block", // Prevent inline descender gap
            imageFit === 'width' ? "w-full" : "w-full max-w-[500px]",
            !isWebtoon && "shadow-soft",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
          )}
          width={800}
          height={1200}
          sizes={imageFit === 'width' ? "100vw" : "(max-width: 500px) 100vw, 500px"}
          priority={priority}
          quality={dataSaver ? 60 : 85}
          unoptimized={!dataSaver}
          loading={priority ? "eager" : "lazy"} 
          style={{ width: "100%", height: "auto", display: "block" }}
          onLoad={() => {
            // Push to next tick to prevent React "update during render" warnings if cached
            setTimeout(() => onLoadComplete(page.index), 0)
          }}
          onError={() => {
            setTimeout(() => {
              setHasError(true)
              onError(page.index)
            }, 0)
          }}
        />
      ) : (
        // Placeholder skeleton while waiting for its turn in the sequential queue
        <div className="w-full min-h-[50vh] flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-border-strong border-t-accent animate-spin" />
        </div>
      )}
    </div>
  )
}
