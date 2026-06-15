"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { YomirraBottomDock } from "./yomirra-bottom-dock"
import { NetworkStatus } from "./network-status"
import { cn } from "@/shared/utils/cn"
import { useSync } from "@/shared/hooks/use-sync"
import { TopNav } from "./top-nav"
import { CommandMenu } from "./command-menu"
import { AnimatePresence, motion } from "motion/react"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReader = pathname?.includes("/read/")
  
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
          {isReader ? (
            children
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {!isReader && <YomirraBottomDock />}
      <CommandMenu />
    </div>
  )
}
