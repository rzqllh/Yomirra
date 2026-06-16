"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"
import { PageItem } from "@/shared/types/source"
import { PageImageError } from "./page-image-error"
import { motion, useMotionValue } from "motion/react"
import { useGesture } from "@use-gesture/react"

interface ReaderImageProps {
  pageIndex: number
  pageUrl: string
  isWebtoon: boolean
  dataSaver: boolean
  isAllowedToLoad: boolean
  onLoadComplete: (index: number) => void
  onError: (index: number) => void
  priority?: boolean
  offlineUrl?: string
  imageFit?: 'width' | 'contained'
  measureElement?: (element: HTMLElement | null) => void
}

export const ReaderImage = React.memo(function ReaderImage({
  pageIndex,
  pageUrl,
  isWebtoon,
  dataSaver,
  isAllowedToLoad,
  onLoadComplete,
  onError,
  priority = false,
  offlineUrl,
  imageFit = 'width',
  measureElement
}: ReaderImageProps) {
  const [hasError, setHasError] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  // Call measureElement on render if it exists and we have an element
  React.useLayoutEffect(() => {
    if (measureElement && containerRef.current) {
      measureElement(containerRef.current);
    }
  });

  // Zoom motion values (No spring physics loop)
  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Double tap logic
  const lastTapTime = React.useRef(0)

  useGesture({
    onPinch: ({ offset: [d], event }) => {
      event.preventDefault()
      const newScale = Math.max(1, Math.min(d, 4))
      scale.set(newScale)
      if (newScale === 1) {
        x.set(0)
        y.set(0)
      }
    },
    onDrag: ({ offset: [ox, oy], pinching, event }) => {
      if (pinching || scale.get() === 1) return
      event.preventDefault() // prevent scrolling while dragged
      x.set(ox)
      y.set(oy)
    },
    onPointerDown: ({ event }) => {
      const now = Date.now()
      if (now - lastTapTime.current < 300) {
        // Double tap
        event.stopPropagation()
        if (scale.get() > 1) {
          scale.set(1)
          x.set(0)
          y.set(0)
        } else {
          scale.set(2.5)
        }
        lastTapTime.current = 0
      } else {
        lastTapTime.current = now
      }
    }
  }, {
    target: containerRef,
    eventOptions: { passive: false },
    pinch: { scaleBounds: { min: 1, max: 4 }, rubberband: true },
    drag: { 
      from: () => [x.get(), y.get()]
    }
  })

  const shouldLoad = isAllowedToLoad

  const handleImageError = () => {
    if (retryCount < 3) {
      const baseDelay = [1000, 2500, 5000][retryCount]
      const jitter = Math.random() * 500
      setTimeout(() => {
        setRetryCount(c => c + 1)
      }, baseDelay + jitter)
    } else {
      setHasError(true)
      onError(pageIndex)
    }
  }

  const handleRetry = () => {
    setHasError(false)
    setRetryCount(0)
  }

  const currentUrl = offlineUrl || (retryCount > 0 && !pageUrl.startsWith('blob:') ? `${pageUrl}${pageUrl.includes('?') ? '&' : '?'}retry=${retryCount}` : pageUrl)
  const estimatedAspectRatio = aspectRatio ? `${aspectRatio}` : "1 / 1.5"

  return (
    <div 
      ref={(el) => {
        containerRef.current = el;
        if (measureElement) measureElement(el);
      }}
      className={cn(
        "reader-page-container w-full flex justify-center overflow-hidden touch-pan-y relative",
        (!shouldLoad || hasError) && "bg-surface-muted/30"
      )}
      data-page-index={pageIndex}
      style={{ 
        touchAction: "pan-y",
        aspectRatio: estimatedAspectRatio,
        minHeight: aspectRatio ? "auto" : "50vh",
        transition: "aspect-ratio 0.3s ease-out"
      }}
    >
      {hasError ? (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 bg-[#0a0a0f] text-white/50">
           <PageImageError index={pageIndex} onRetry={handleRetry} />
        </div>
      ) : shouldLoad ? (
        <motion.div style={{ x, y, scale }} className="w-full h-full origin-center flex justify-center">
          <Image 
            src={currentUrl}
            alt={`Page ${pageIndex}`}
            className={cn(
              "block w-full h-full object-contain",
              !isWebtoon && "shadow-soft",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
            )}
            width={800}
            height={1200}
            sizes={imageFit === 'width' ? "100vw" : "(max-width: 500px) 100vw, 500px"}
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            quality={dataSaver ? 60 : 85}
            unoptimized={!dataSaver}
            loading="eager"
            decoding="async"
            onLoad={(e) => {
              const target = e.currentTarget;
              if (target.naturalWidth === 0) {
                handleImageError();
                return;
              }
              // Update aspect ratio for progressive height correction
              setAspectRatio(target.naturalWidth / target.naturalHeight);
              
              if (measureElement && containerRef.current) {
                measureElement(containerRef.current);
              }
              
              setTimeout(() => onLoadComplete(pageIndex), 0)
            }}
            onError={handleImageError}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-border-strong border-t-accent animate-spin" />
        </div>
      )}
    </div>
  )
})
