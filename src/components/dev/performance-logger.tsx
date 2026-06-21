"use client"

import * as React from "react"
import { createPortal } from "react-dom"

export function PerformanceLogger() {
  const [fps, setFps] = React.useState(60)
  const [dropped, setDropped] = React.useState(0)
  
  React.useEffect(() => {
    let lastTime = performance.now()
    let frames = 0
    let rafId: number
    
    const loop = (now: number) => {
      frames++
      const delta = now - lastTime
      
      if (delta >= 1000) {
        const currentFps = Math.round((frames * 1000) / delta)
        setFps(currentFps)
        if (currentFps < 30) {
          setDropped(d => d + 1)
        }
        frames = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(loop)
    }
    
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (process.env.NODE_ENV !== "development") return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 left-4 z-[9999] bg-black/80 backdrop-blur-md -white/10 text-white text-[10px] font-mono p-2 rounded pointer-events-none flex flex-col gap-1 -xl">
      <div className="flex justify-between gap-4">
        <span className="text-white/60">FPS</span>
        <span className={fps < 30 ? "text-red-400 font-bold" : fps < 50 ? "text-yellow-400" : "text-green-400"}>
          {fps}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-white/60">Drops</span>
        <span className={dropped > 0 ? "text-red-400" : ""}>{dropped}</span>
      </div>
    </div>,
    document.body
  )
}
