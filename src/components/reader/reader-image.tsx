"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"
import {
  transitionReaderPageQueueState,
  type ReaderPageQueueState,
} from "@/shared/lib/reader-load-order"

import { PageImageError } from "./page-image-error"
import { motion, useMotionValue, animate } from "motion/react"
import { useGesture } from "@use-gesture/react"

interface ReaderImageProps {
  pageIndex: number
  pageUrl: string
  isWebtoon: boolean
  dataSaver: boolean
  isAllowedToLoad: boolean
  isAllowedToReveal?: boolean
  onLoadComplete: (index: number) => void
  onError: (index: number) => void
  imageFit?: 'width' | 'contained'
  onReport?: (pageIndex: number) => void
  onSwitchSource?: () => void;
  dataIndex?: number;
  totalPages?: number;
  priority?: boolean;
  offlineUrl?: string;
  onRefreshUrl?: (index: number) => Promise<string | null>;
  fallbackProxyUrl?: string;
  onPermanentFailure?: (index: number) => void;
  pageWidth?: number;
  pageHeight?: number;
}

export const ReaderImage = React.memo(function ReaderImage({
  pageIndex,
  pageUrl,
  isWebtoon,
  dataSaver,
  isAllowedToLoad,
  isAllowedToReveal = true,
  onLoadComplete,
  onError,
  priority = false,
  offlineUrl,
  onRefreshUrl,
  fallbackProxyUrl,
  onPermanentFailure,
  pageWidth,
  pageHeight,
  imageFit = 'width',
  onReport,
  onSwitchSource,
  dataIndex,
  totalPages
}: ReaderImageProps) {
  const knownAspectRatio =
    pageWidth && pageHeight && pageWidth > 0 && pageHeight > 0
      ? pageWidth / pageHeight
      : null
  const [hasError, setHasError] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(knownAspectRatio)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [queueState, setQueueState] = React.useState<ReaderPageQueueState>("idle")
  const queueStateRef = React.useRef<ReaderPageQueueState>("idle")
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadGenerationRef = React.useRef(0)
  const mountedRef = React.useRef(true)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const moveQueueState = React.useCallback((event: Parameters<typeof transitionReaderPageQueueState>[1]) => {
    const next = transitionReaderPageQueueState(queueStateRef.current, event)
    queueStateRef.current = next
    if (mountedRef.current) setQueueState(next)
    return next
  }, [])

  const clearRetryTimer = React.useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])
  
  const [useFallback, setUseFallback] = React.useState(false)
  const [bypassOptimizer, setBypassOptimizer] = React.useState(false)
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
  const shouldReveal = isAllowedToReveal && hasLoaded;

  React.useLayoutEffect(() => {
    const generation = ++loadGenerationRef.current
    clearRetryTimer()
    setHasLoaded(false)
    setAspectRatio(knownAspectRatio)

    queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "reset")
    queueStateRef.current = transitionReaderPageQueueState(
      queueStateRef.current,
      isAllowedToLoad ? "queue" : "cancel"
    )
    if (isAllowedToLoad) {
      queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "start")
    }
    setQueueState(queueStateRef.current)

    return () => {
      if (loadGenerationRef.current === generation) {
        loadGenerationRef.current += 1
        clearRetryTimer()
        queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "cancel")
      }
    }
  }, [currentUrl, isAllowedToLoad, knownAspectRatio, clearRetryTimer])

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      loadGenerationRef.current += 1
      clearRetryTimer()
      queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "cancel")
    }
  }, [clearRetryTimer])

  const handleImageError = async (generation = loadGenerationRef.current) => {
    if (!mountedRef.current || generation !== loadGenerationRef.current) return

    if (offlineUrl && !useFallback) {
      setUseFallback(true)
      return
    }

    if (!bypassOptimizer && dataSaver && !currentUrl.startsWith('blob:') && !currentUrl.startsWith('data:')) {
      setBypassOptimizer(true)
      return
    }

    if (retryCount < 3) {
      const baseDelay = [1000, 2500, 5000][retryCount]
      const jitter = Math.random() * 500
      clearRetryTimer()
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null
        if (!mountedRef.current || generation !== loadGenerationRef.current) return
        setRetryCount(c => c + 1)
      }, baseDelay + jitter)
      return
    }

    if (onRefreshUrl && !hasAttemptedRefresh) {
      setHasAttemptedRefresh(true)
      try {
        const freshUrl = await onRefreshUrl(pageIndex)
        if (!mountedRef.current || generation !== loadGenerationRef.current) return
        if (freshUrl && freshUrl !== pageUrl) {
          setRefreshedUrl(freshUrl)
          setRetryCount(0)
          return
        }
      } catch {
        if (!mountedRef.current || generation !== loadGenerationRef.current) return
      }
    }

    if (fallbackProxyUrl && !hasAttemptedProxy) {
      setHasAttemptedProxy(true)
      setUseFallback(true)
      setRetryCount(0)
      return
    }

    moveQueueState("fail")
    setHasError(true)
    onError(pageIndex)
    onPermanentFailure?.(pageIndex)
  }

  const handleRetry = () => {
    clearRetryTimer()
    loadGenerationRef.current += 1
    queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "reset")
    queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "queue")
    queueStateRef.current = transitionReaderPageQueueState(queueStateRef.current, "start")
    setQueueState(queueStateRef.current)
    setHasError(false)
    setHasLoaded(false)
    setBypassOptimizer(false)
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
        (!shouldLoad || !shouldReveal || hasError) && "bg-surface-muted/30"
      )}
      data-page-index={pageIndex}
      data-load-state={queueState}
      style={{ 
        touchAction: "pan-y",
        aspectRatio: aspectRatio ? estimatedAspectRatio : (isWebtoon ? "auto" : estimatedAspectRatio),
        minHeight: aspectRatio ? "auto" : "50vh",
        transition: "aspect-ratio 0.3s ease-out"
      }}
    >
      {hasError && isAllowedToReveal ? (
        <PageImageError index={pageIndex} onRetry={handleRetry} onReport={onReport} onSwitchSource={onSwitchSource} />
      ) : shouldLoad && !hasError ? (
        <>
          <motion.div
            style={{ x, y, scale }}
            className={cn(
              "w-full h-full origin-center flex justify-center transform-gpu will-change-transform transition-opacity duration-100",
              shouldReveal ? "opacity-100" : "opacity-0"
            )}
          >
            <Image 
              src={currentUrl}
              alt={`Page ${pageIndex + 1}`}
              className={cn(
                "block w-full",
                isWebtoon ? "h-auto" : "h-full object-contain shadow-soft"
              )}
              width={pageWidth && pageWidth > 0 ? pageWidth : 800}
              height={pageHeight && pageHeight > 0 ? pageHeight : 1200}
              sizes={imageFit === 'width' ? "100vw" : "(max-width: 768px) 100vw, 1200px"}
              priority={priority}
              fetchPriority={priority ? "high" : "auto"}
              quality={dataSaver ? 60 : 85}
              unoptimized={!dataSaver || bypassOptimizer || currentUrl.startsWith('blob:') || currentUrl.startsWith('data:')}
              loading="eager"
              decoding="async"
              onLoad={async (e) => {
                const target = e.currentTarget
                const generation = loadGenerationRef.current
                if (target.naturalWidth === 0) {
                  await handleImageError(generation)
                  return
                }

                try {
                  if (typeof target.decode === "function") {
                    await target.decode()
                  }
                } catch {
                  await handleImageError(generation)
                  return
                }

                if (!mountedRef.current || generation !== loadGenerationRef.current) return

                setAspectRatio(target.naturalWidth / target.naturalHeight)
                moveQueueState("decode")
                setHasLoaded(true)
                onLoadComplete(pageIndex)
              }}
              onError={() => void handleImageError()}
            />
          </motion.div>

          {!shouldReveal && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-muted/10">
              <div className="size-8 rounded-full border-[3px] border-border-strong border-t-accent animate-spin" />
            </div>
          )}
        </>
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
