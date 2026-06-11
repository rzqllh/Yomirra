"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { BottomNav } from "./bottom-nav"
import { SideNav } from "./side-nav"
import { TopNav } from "./top-nav"
import { CommandMenu } from "./command-menu"
import { cn } from "@/shared/utils/cn"
import { useSync } from "@/shared/hooks/use-sync"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReader = pathname?.includes("/read/")
  
  // Mount background cross-device sync
  useSync()

  React.useEffect(() => {
    if (isReader) {
      document.body.classList.add("reader-active")
    } else {
      document.body.classList.remove("reader-active")
    }
    return () => document.body.classList.remove("reader-active")
  }, [isReader])

  return (
    <div className="flex min-h-screen bg-background text-text-primary overflow-x-hidden w-full max-w-full">
      {!isReader && <SideNav />}
      
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all min-w-0",
        !isReader && "md:ml-[80px] lg:ml-[240px]"
      )}>
        {!isReader && <TopNav />}
        
        <main
          className={cn(
            "flex-1 flex flex-col w-full min-w-0",
            !isReader && "pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0" // Padding for BottomNav only on mobile
          )}
        >
          {children}
        </main>
      </div>

      {!isReader && <BottomNav />}
      <CommandMenu />
    </div>
  )
}
