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
  priority?: boolean
  offlineUrl?: string
  imageFit?: 'width' | 'contained'
  decodeQueue?: {
    addToQueue: (id: string, url: string, priority: number) => void;
    removeFromQueue: (id: string) => void;
    isDecoded: (id: string) => boolean;
  };
  dataIndex?: number;
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
  decodeQueue,
  dataIndex
}: ReaderImageProps) {
  const [hasError, setHasError] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  const imageId = `${pageUrl}`;
  const currentUrl = offlineUrl || (retryCount > 0 && !pageUrl.startsWith('blob:') ? `${pageUrl}${pageUrl.includes('?') ? '&' : '?'}retry=${retryCount}` : pageUrl);

  React.useEffect(() => {
    if (decodeQueue && isAllowedToLoad) {
      // Priority based on index, smaller index means closer to viewport or earlier page
      decodeQueue.addToQueue(imageId, currentUrl, pageIndex);
    }
    return () => {
      if (decodeQueue) decodeQueue.removeFromQueue(imageId);
    };
  }, [decodeQueue, imageId, currentUrl, pageIndex, isAllowedToLoad]);

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

  // If using decode queue, only load if it's decoded or if queue not provided.
  // We still check isAllowedToLoad.
  const isDecoded = decodeQueue ? decodeQueue.isDecoded(imageId) : true;
  const shouldLoad = isAllowedToLoad && isDecoded;

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
        <PageImageError index={pageIndex} onRetry={handleRetry} />
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
              
              setTimeout(() => onLoadComplete(pageIndex), 0)
            }}
            onError={handleImageError}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-pulse-slow" />
          <div className="size-10 rounded-full border border-white/10 border-t-white/50 animate-spin z-10 drop-shadow-md" />
        </div>
      )}
    </div>
  )
})
