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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReader = pathname?.includes("/read/")
  
  useSync()
  useNsfwPatcher()
  // Trigger background chapter scan on app open (respects checkOnAppStart + cooldown settings)
  useUpdateChecker({ checkOnMount: true })

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

  return (
    <div className="flex min-h-dvh bg-background text-text-primary w-full max-w-full">
      {!isReader && <StatusBarBlur />}
      <NetworkStatus />
      
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
        {!isReader && <BottomDock />}
      </div>

      <CommandMenu />
    </div>
  )
}
