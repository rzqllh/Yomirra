"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"

import { PageImageError } from "./page-image-error"
import { motion, useMotionValue, animate } from "motion/react"
import { useGesture } from "@use-gesture/react"

interface ReaderImageProps {
  pageIndex: number
  pageUrl: string
  isWebtoon: boolean
  dataSaver: boolean
  isAllowedToLoad: boolean
  onLoadComplete: (index: number) => void
  onError: (index: number) => void
  imageFit?: 'width' | 'contained'
  onReport?: (pageIndex: number) => void
  dataIndex?: number;
  totalPages?: number;
  priority?: boolean;
  offlineUrl?: string;
  onRefreshUrl?: (index: number) => Promise<string | null>;
  fallbackProxyUrl?: string;
  onPermanentFailure?: (index: number) => void;
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
  onRefreshUrl,
  fallbackProxyUrl,
  onPermanentFailure,
  imageFit = 'width',
  onReport,
  dataIndex,
  totalPages
}: ReaderImageProps) {
  const [hasError, setHasError] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  const [useFallback, setUseFallback] = React.useState(false)
  const [refreshedUrl, setRefreshedUrl] = React.useState<string | null>(null)
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = React.useState(false)
  const [hasAttemptedProxy, setHasAttemptedProxy] = React.useState(false)

  const activeBaseUrl = refreshedUrl || (useFallback && fallbackProxyUrl ? fallbackProxyUrl : (offlineUrl && !useFallback ? offlineUrl : pageUrl));

  const currentUrl = (offlineUrl && !useFallback && !refreshedUrl) 
    ? offlineUrl 
    : (retryCount > 0 && !activeBaseUrl.startsWith('blob:') && !activeBaseUrl.startsWith('data:')
        ? `${activeBaseUrl}${activeBaseUrl.includes('?') ? '&' : '?'}retry=${retryCount}` 
        : activeBaseUrl);

  // Zoom motion values with spring physics
  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [isZoomed, setIsZoomed] = React.useState(false)

  const resetZoom = React.useCallback((smooth = true) => {
    if (smooth) {
      animate(scale, 1, { type: "spring", stiffness: 350, damping: 30 })
      animate(x, 0, { type: "spring", stiffness: 350, damping: 30 })
      animate(y, 0, { type: "spring", stiffness: 350, damping: 30 })
    } else {
      scale.set(1)
      x.set(0)
      y.set(0)
    }
    setIsZoomed(false)
    document.documentElement.classList.remove('is-pinching')
  }, [scale, x, y])

  useGesture({
    onPinch: ({ offset: [d], event }) => {
      event.preventDefault()
      const newScale = Math.max(0.85, Math.min(d, 4.5))
      scale.set(newScale)
      const zoomed = newScale > 1.05
      setIsZoomed(zoomed)
      if (zoomed) {
        document.documentElement.classList.add('is-pinching')
      } else {
        document.documentElement.classList.remove('is-pinching')
      }
    },
    onPinchEnd: ({ offset: [d] }) => {
      if (d <= 1.08) {
        resetZoom(true)
      } else {
        const targetScale = Math.min(Math.max(d, 1), 4)
        animate(scale, targetScale, { type: "spring", stiffness: 400, damping: 32 })
        setIsZoomed(targetScale > 1.05)
      }
    },
    onDrag: ({ offset: [ox, oy], pinching, event }) => {
      if (pinching || scale.get() <= 1.05) return
      event.preventDefault()

      const container = containerRef.current
      const currentScale = scale.get()
      const maxDragX = container ? (container.clientWidth * (currentScale - 1)) / 2 : 250
      const maxDragY = container ? (container.clientHeight * (currentScale - 1)) / 2 : 350

      const boundedX = Math.max(-maxDragX, Math.min(maxDragX, ox))
      const boundedY = Math.max(-maxDragY, Math.min(maxDragY, oy))

      x.set(boundedX)
      y.set(boundedY)
    },
    onDragEnd: () => {
      if (scale.get() <= 1.05) {
        resetZoom(true)
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

  // Double-tap to zoom toggle (1x <-> 2.2x)
  const lastTapRef = React.useRef<number>(0)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (scale.get() > 1.1) {
        resetZoom(true)
      } else {
        animate(scale, 2.2, { type: "spring", stiffness: 350, damping: 28 })
        setIsZoomed(true)
        document.documentElement.classList.add('is-pinching')
      }
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  const shouldLoad = isAllowedToLoad;

  const handleImageError = async () => {
    if (offlineUrl && !useFallback) {
      // Offline cached page missing -> allow network fallback
      setUseFallback(true);
      return;
    }

    if (retryCount < 3) {
      const baseDelay = [1000, 2500, 5000][retryCount]
      const jitter = Math.random() * 500
      setTimeout(() => {
        setRetryCount(c => c + 1)
      }, baseDelay + jitter)
      return;
    }

    if (onRefreshUrl && !hasAttemptedRefresh) {
      setHasAttemptedRefresh(true)
      try {
        const freshUrl = await onRefreshUrl(pageIndex)
        if (freshUrl && freshUrl !== pageUrl) {
          setRefreshedUrl(freshUrl)
          setRetryCount(0)
          return
        }
      } catch {
        // Fall through to proxy or error state
      }
    }

    if (fallbackProxyUrl && !hasAttemptedProxy) {
      setHasAttemptedProxy(true)
      setUseFallback(true)
      setRetryCount(0)
      return
    }

    setHasError(true)
    onError(pageIndex)
    onPermanentFailure?.(pageIndex)
  }

  const handleRetry = () => {
    setHasError(false)
    setRetryCount(0)
    setUseFallback(false)
    setHasAttemptedRefresh(false)
    setHasAttemptedProxy(false)
    setRefreshedUrl(null)
  }

  const estimatedAspectRatio = aspectRatio ? `${aspectRatio}` : "1 / 1.5"

  return (
    <div 
      ref={containerRef}
      data-index={dataIndex}
      onPointerDown={handlePointerDown}
      className={cn(
        "reader-page-container w-full flex justify-center touch-pan-y relative select-none",
        isZoomed ? "z-30 overflow-visible" : "z-0 overflow-hidden",
        (!shouldLoad || hasError) && "bg-surface-muted/30"
      )}
      data-page-index={pageIndex}
      style={{ 
        touchAction: "pan-y",
        aspectRatio: isWebtoon ? "auto" : estimatedAspectRatio,
        minHeight: aspectRatio ? "auto" : "50vh",
        transition: "aspect-ratio 0.3s ease-out"
      }}
    >
      {hasError ? (
        <PageImageError index={pageIndex} onRetry={handleRetry} onReport={onReport} />
      ) : shouldLoad ? (
        <motion.div style={{ x, y, scale }} className="w-full h-full origin-center flex justify-center transform-gpu will-change-transform">
          <Image 
            src={currentUrl}
            alt={`Page ${pageIndex}`}
            className={cn(
              "block w-full",
              isWebtoon ? "h-auto" : "h-full object-contain shadow-soft",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
            )}
            width={800}
            height={1200}
            sizes={imageFit === 'width' ? "100vw" : "(max-width: 768px) 100vw, 1200px"}
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            quality={dataSaver ? 60 : 85}
            unoptimized={!dataSaver || currentUrl.startsWith('blob:') || currentUrl.startsWith('data:')}
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
              
              setTimeout(() => onLoadComplete(pageIndex), 0)
            }}
            onError={handleImageError}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-surface-muted/10 overflow-hidden">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-pulse-slow" />
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="size-10 rounded-full border-[3px] border-border-strong border-t-accent animate-spin drop-shadow-md" />
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold tracking-wide text-text-primary/90 animate-pulse">
                Memuat halaman {pageIndex + 1}{totalPages ? ` / ${totalPages}` : ''}...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
