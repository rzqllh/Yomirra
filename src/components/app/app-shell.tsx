"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { BottomDock } from "./bottom-dock"
import { NetworkStatus } from "./network-status"
import { cn } from "@/shared/utils/cn"
import { useSync } from "@/shared/hooks/use-sync"
import { useNsfwPatcher } from "@/shared/hooks/use-nsfw-patcher"
import { TopNav } from "./top-nav"
import { CommandMenu } from "./command-menu"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReader = pathname?.includes("/read/")
  
  useSync()
  useNsfwPatcher()

  React.useEffect(() => {
    if (isReader) {
      document.body.classList.add("reader-active")
    } else {
      document.body.classList.remove("reader-active")
    }

    // Prevent pinch-zoom globally except in reader (for iOS PWA)
    const handleTouchMove = (e: TouchEvent) => {
      if (!isReader && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent double tap to zoom via gesturestart (iOS specific)
    const handleGestureStart = (e: Event) => {
      if (!isReader) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("gesturestart", handleGestureStart, { passive: false });

    return () => {
      document.body.classList.remove("reader-active");
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("gesturestart", handleGestureStart);
    }
  }, [isReader])

  return (
    <div className="flex min-h-screen bg-background text-text-primary w-full max-w-full">
      <NetworkStatus />
      
      <div className="flex-1 flex flex-col min-h-screen transition-all min-w-0 duration-300 ease-in-out w-full">
        {!isReader && <TopNav />}
        
        <main
          className={cn(
            "flex-1 flex flex-col w-full min-w-0 transition-all duration-300 overflow-x-hidden",
            !isReader && "pb-[var(--page-bottom-safe)] md:pb-0"
          )}
        >
          {children}
        </main>
      </div>

      {!isReader && <BottomDock />}
      <CommandMenu />
    </div>
  )
}
