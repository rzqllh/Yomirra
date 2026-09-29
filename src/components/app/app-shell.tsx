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
import { DirectionalTransition } from "@/components/ui/directional-transition"
import { StatusBarBlur } from "@/components/ui/status-bar-blur"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "motion/react"
import {
  endNavigationIntent,
  getNavigationPathname,
  NAVIGATION_INTENT_EVENT,
  type NavigationIntentDetail,
} from "@/shared/lib/navigation-intent"

function PendingNavigationSurface({ reader }: { reader: boolean }) {
  if (reader) {
    return (
      <div
        className="fixed inset-0 z-[64] bg-black pointer-events-auto"
        aria-hidden="true"
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-[800px] flex-col gap-1 pt-[calc(var(--safe-top,0px)+64px)]">
          <Skeleton className="h-[58vh] w-full rounded-none bg-white/[0.05]" />
          <Skeleton className="h-[42vh] w-full rounded-none bg-white/[0.04]" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[45] bg-background pointer-events-auto md:left-[76px] xl:left-[240px]"
      aria-hidden="true"
    >
      <div className="mx-auto flex w-full max-w-9xl flex-col gap-6 px-4 pt-[calc(var(--safe-top,0px)+var(--mobile-header-height,56px)+20px)] md:px-8 md:pt-24">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-3.5 w-4/5 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReader = pathname?.includes("/read/")
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)
  
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
    }, 12000)
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

  React.useEffect(() => {
    if (isReader || !pathname) return;

    const storageKey = `yomirra:scroll:${pathname}`;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    let target = 0;
    try {
      const saved = sessionStorage.getItem(storageKey);
      target = saved ? Number(saved) : 0;
    } catch {
      target = 0;
    }

    const frame = requestAnimationFrame(() => {
      window.scrollTo({
        top: Number.isFinite(target) ? target : 0,
        left: 0,
        behavior: "instant",
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {
        // Scroll restoration is optional.
      }
      window.history.scrollRestoration = previousRestoration;
    };
  }, [pathname, isReader]);

  const pendingIsReader = pendingHref
    ? getNavigationPathname(pendingHref).includes("/read/")
    : false

  return (
    <div className="flex min-h-dvh bg-background text-text-primary w-full max-w-full">
      {!isReader && <StatusBarBlur />}
      <NetworkStatus />

      <AnimatePresence>
        {pendingHref && (
          <motion.div
            key={pendingHref}
            className="fixed left-0 right-0 z-[90] h-[2px] origin-left bg-accent"
            style={{ top: "var(--safe-top, 0px)" }}
            initial={{ scaleX: 0.04, opacity: 1 }}
            animate={{ scaleX: 0.72, opacity: 1 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.16 },
            }}
            data-testid="navigation-progress-bar"
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {pendingHref && (
          <motion.div
            key={`pending-${pendingHref}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          >
            <PendingNavigationSurface reader={pendingIsReader} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={cn(
        "flex-1 flex flex-col min-h-dvh transition-all min-w-0 duration-300 ease-in-out w-full",
        !isReader && "md:pl-[76px] xl:pl-[240px]"
      )}>
        {!isReader && <TopNav />}
        {!isReader && <DesktopRail />}
        
        <main
          className={cn(
            "flex-1 flex flex-col w-full min-w-0 transition-all duration-300 overflow-x-hidden",
            !isReader && "pb-[var(--page-bottom-safe)] md:pb-0"
          )}
        >
          {isReader ? children : <DirectionalTransition>{children}</DirectionalTransition>}
        </main>
        {!isReader && <BottomDock pendingHref={pendingHref} />}
      </div>

      <CommandMenu />
    </div>
  )
}
