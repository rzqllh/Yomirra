"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/shared/utils/cn"
import { PageItem } from "@/shared/types/source"
import { PageImageError } from "./page-image-error"
import { motion, useSpring } from "motion/react"
import { useGesture } from "@use-gesture/react"

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

  // Zoom springs
  const scale = useSpring(1, { bounce: 0, stiffness: 400, damping: 30 })
  const x = useSpring(0, { bounce: 0, stiffness: 400, damping: 30 })
  const y = useSpring(0, { bounce: 0, stiffness: 400, damping: 30 })

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
        "reader-page-container w-full flex justify-center overflow-hidden touch-pan-y",
        (!shouldLoad || hasError) && "min-h-[50vh] bg-surface-muted/30"
      )}
      data-page-index={page.index}
      style={{ touchAction: "pan-y" }} // Allow scrolling, but pinch/drag intercept it
    >
      {hasError ? (
        <div className="w-full flex items-center justify-center p-4">
          <PageImageError index={page.index} onRetry={handleRetry} />
        </div>
      ) : shouldLoad ? (
        <motion.div style={{ x, y, scale }} className="w-full origin-center flex justify-center">
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
            fetchPriority={priority ? "high" : "auto"}
            quality={dataSaver ? 60 : 85}
            unoptimized={!dataSaver}
            loading={priority ? "eager" : "lazy"} 
            style={{ width: "100%", height: "auto", display: "block" }}
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth === 0) {
                setTimeout(() => {
                  setHasError(true)
                  onError(page.index)
                }, 0)
                return;
              }
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
        </motion.div>
      ) : (
        // Placeholder skeleton while waiting for its turn in the sequential queue
        <div className="w-full min-h-[50vh] flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-border-strong border-t-accent animate-spin" />
        </div>
      )}
    </div>
  )
}
