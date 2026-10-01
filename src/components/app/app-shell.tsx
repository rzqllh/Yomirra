"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { BottomDock } from "./bottom-dock"
import { NetworkStatus } from "./network-status"
import { cn } from "@/shared/utils/cn"
import { useSync } from "@/shared/hooks/use-sync"
import { useNsfwPatcher } from "@/shared/hooks/use-nsfw-patcher"
import { useUpdateChecker } from "@/shared/hooks/use-update-checker"
import { TopNav } from "./top-nav"
import { DesktopRail } from "./desktop-rail"
import { CommandMenu } from "./command-menu"
import { PageTransition } from "@/components/motion/page-transition"
import { StatusBarBlur } from "@/components/ui/status-bar-blur"
import { AnimatePresence, motion } from "motion/react"
import { useDelayedFlag } from "@/shared/hooks/use-delayed-flag"
import { navigationTiming, transitions } from "@/shared/lib/motion/tokens"
import {
  endNavigationIntent,
  getNavigationPathname,
  NAVIGATION_INTENT_EVENT,
  type NavigationIntentDetail,
} from "@/shared/lib/navigation-intent"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReader = pathname?.includes("/read/")
  const isAdmin = pathname?.startsWith("/admin")
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)
  const showNavigationProgress = useDelayedFlag(
    Boolean(pendingHref),
    navigationTiming.feedbackDelayMs
  )
  
  useSync()
  useNsfwPatcher()
  // Trigger background chapter scan on app open (respects checkOnAppStart + cooldown settings)
  useUpdateChecker({ checkOnMount: true })

  React.useEffect(() => {
    const handleNavigationIntent = (event: Event) => {
      const customEvent = event as CustomEvent<NavigationIntentDetail>
      if (!customEvent.detail?.href) return
      setPendingHref(customEvent.detail.href)
    }

    window.addEventListener(NAVIGATION_INTENT_EVENT, handleNavigationIntent)
    return () => {
      window.removeEventListener(NAVIGATION_INTENT_EVENT, handleNavigationIntent)
    }
  }, [])

  React.useEffect(() => {
    if (!pendingHref || !pathname) return
    if (getNavigationPathname(pendingHref) !== pathname) return

    endNavigationIntent()
    setPendingHref(null)
  }, [pathname, pendingHref])

  React.useEffect(() => {
    if (!pendingHref) return
    const timeout = window.setTimeout(() => {
      endNavigationIntent()
      setPendingHref(null)
    }, navigationTiming.recoveryTimeoutMs)
    return () => window.clearTimeout(timeout)
  }, [pendingHref])

  React.useEffect(() => {
    if (isReader) {
      document.body.classList.add("reader-active")
    } else {
      document.body.classList.remove("reader-active")
    }

    return () => {
      document.body.classList.remove("reader-active");
    }
  }, [isReader]);

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh bg-background text-text-primary w-full max-w-full">
      {!isReader && <StatusBarBlur />}
      <NetworkStatus />

      <AnimatePresence>
        {showNavigationProgress && pendingHref && (
          <motion.div
            key={pendingHref}
            className="fixed left-0 right-0 z-[90] h-[2px] origin-left bg-accent"
            style={{ top: "var(--safe-top, 0px)" }}
            initial={{ scaleX: 0.04, opacity: 1 }}
            animate={{ scaleX: 0.72, opacity: 1 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { duration: 0.9, ease: transitions.page.ease },
              opacity: { duration: 0.16 },
            }}
            data-testid="navigation-progress-bar"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "flex-1 flex flex-col min-h-dvh transition-all min-w-0 duration-300 ease-in-out w-full",
        !isReader && "md:pl-[76px] xl:pl-[240px]"
      )}>
        {!isReader && <TopNav />}
        {!isReader && <DesktopRail pendingHref={pendingHref} />}
        
        <main
          className={cn(
            "flex-1 flex flex-col w-full min-w-0 transition-all duration-300 overflow-x-hidden",
            !isReader && "pb-[var(--page-bottom-safe)] md:pb-0"
          )}
        >
          {isReader ? children : <PageTransition>{children}</PageTransition>}
        </main>
        {!isReader && <BottomDock pendingHref={pendingHref} />}
      </div>

      <CommandMenu />
    </div>
  )
}
