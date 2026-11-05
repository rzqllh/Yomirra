"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"
import {
  transitionReaderPageQueueState,
  type ReaderPageQueueState,
} from "@/shared/lib/reader-load-order"

import { PageImageError } from "./page-image-error"

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
      data-index={dataIndex}
      className={cn(
        "reader-page-container relative flex w-full justify-center overflow-hidden select-none",
        (!shouldLoad || !shouldReveal || hasError) && "bg-surface-muted/30"
      )}
      data-page-index={pageIndex}
      data-load-state={queueState}
      style={{ 
        aspectRatio: aspectRatio ? estimatedAspectRatio : (isWebtoon ? "auto" : estimatedAspectRatio),
        minHeight: aspectRatio ? "auto" : "50vh",
        transition: "aspect-ratio 0.3s ease-out"
      }}
    >
      {hasError && isAllowedToReveal ? (
        <PageImageError index={pageIndex} onRetry={handleRetry} onReport={onReport} onSwitchSource={onSwitchSource} />
      ) : shouldLoad && !hasError ? (
        <>
          <div
            className={cn(
              "w-full h-full flex justify-center transition-opacity duration-100",
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
              fetchPriority={priority ? "high" : "low"}
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
          </div>

          {!shouldReveal && (
            <div className="absolute inset-0 bg-surface-muted/10 pointer-events-none" />
          )}
        </>
      ) : (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-surface-muted/10 overflow-hidden">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-pulse-slow pointer-events-none" />
          <div className="flex flex-col items-center z-10 select-none">
            <span className="text-xs font-medium tracking-wide text-text-muted/60">
              Halaman {pageIndex + 1}{totalPages ? ` / ${totalPages}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
})
