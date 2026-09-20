"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"

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
  imageFit?: 'width' | 'contained'
  reportUrl?: string
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
  reportUrl,
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

  // Zoom motion values (No spring physics loop)
  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useGesture({
    onPinch: ({ offset: [d], event }) => {
      event.preventDefault()
      const newScale = Math.max(1, Math.min(d, 4))
      scale.set(newScale)
      if (newScale > 1) {
        document.documentElement.classList.add('is-pinching');
      } else {
        document.documentElement.classList.remove('is-pinching');
      }
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
    }
  }, {
    target: containerRef,
    eventOptions: { passive: false },
    pinch: { scaleBounds: { min: 1, max: 4 }, rubberband: true },
    drag: { 
      from: () => [x.get(), y.get()]
    }
  })

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
      className={cn(
        "reader-page-container w-full flex justify-center overflow-hidden touch-pan-y relative",
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
        <PageImageError index={pageIndex} onRetry={handleRetry} reportUrl={reportUrl} />
      ) : shouldLoad ? (
        <motion.div style={{ x, y, scale }} className="w-full h-full origin-center flex justify-center">
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
            sizes={imageFit === 'width' ? "100vw" : "(max-width: 500px) 100vw, 500px"}
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
