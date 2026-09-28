"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DOCK_NAV_ITEMS } from "@/shared/config/nav"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"
import { useSearchFilterStore } from "@/shared/store/search-filter-store"
import { Icon } from "@/components/ui/icon"

export function BottomDock() {
  const pathname = usePathname()

  // Main navigation items excluding settings and search (which is in its own satellite container)
  const mainItems = DOCK_NAV_ITEMS.filter(
    (item) => item.href !== "/settings" && item.href !== "/search"
  )
  const searchItem = DOCK_NAV_ITEMS.find((item) => item.href === "/search") ?? {
    href: "/search",
    icon: DOCK_NAV_ITEMS[4].icon,
    label: "Cari",
  }

  const isMainTabActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  const isSearchActive = pathname === "/search" || pathname?.startsWith("/search")

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 w-full z-[var(--z-sticky)] pointer-events-none"
      style={{
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-[420px] mx-auto items-center justify-center gap-2 sm:gap-2.5">
        {/* Main Dock Capsule */}
        <div className="flex-1 h-[56px] sm:h-[58px] flex items-center justify-between gap-1 rounded-full border border-border-subtle bg-surface-overlay/80 p-1.5 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.7),0_12px_36px_-4px_rgba(0,0,0,0.12),0_4px_14px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.14),0_16px_40px_-6px_rgba(0,0,0,0.6),0_4px_16px_-2px_rgba(0,0,0,0.4)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300">
          {mainItems.map((item) => {
            const isActive = isMainTabActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-center h-full rounded-full outline-none tap-highlight-transparent transition-all duration-200 ease-out select-none active:scale-95",
                  isActive
                    ? "shrink-0 px-3.5 sm:px-4"
                    : "flex-1 min-w-0"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border border-accent/30 dark:border-accent/40 bg-accent/15 dark:bg-accent/22 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_2px_8px_rgba(206,101,82,0.15)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_12px_rgba(206,101,82,0.25)]"
                    layoutId="active-dock-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full">
                  <Icon
                    icon={item.icon}
                    size={isActive ? 18 : 20}
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "transition-colors duration-200 shrink-0",
                      isActive
                        ? "text-accent"
                        : "text-text-muted hover:text-text-primary dark:text-text-secondary dark:hover:text-text-primary"
                    )}
                  />

                  {isActive && (
                    <span className="text-[12px] sm:text-[13px] tracking-tight leading-none font-bold text-accent whitespace-nowrap animate-in fade-in duration-150">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Separated Search Button (iOS liquid glass satellite style) */}
        <Link
          href={searchItem.href}
          onClick={() => {
            useSearchFilterStore.getState().resetFilters()
          }}
          className={cn(
            "relative flex items-center justify-center size-[56px] sm:size-[58px] shrink-0 rounded-full outline-none tap-highlight-transparent transition-all duration-200 ease-out active:scale-95 select-none",
            "border border-border-subtle bg-surface-overlay/80 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.7),0_12px_36px_-4px_rgba(0,0,0,0.12),0_4px_14px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.14),0_16px_40px_-6px_rgba(0,0,0,0.6),0_4px_16px_-2px_rgba(0,0,0,0.4)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300",
            isSearchActive &&
            "border-accent/35 dark:border-accent/45 bg-accent/15 dark:bg-accent/22 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_4px_14px_rgba(206,101,82,0.22)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_16px_rgba(206,101,82,0.3)]"
          )}
          aria-label={searchItem.label}
          aria-current={isSearchActive ? "page" : undefined}
        >
          <Icon
            icon={searchItem.icon}
            size={21}
            weight={isSearchActive ? "bold" : "regular"}
            className={cn(
              "transition-colors duration-200 shrink-0",
              isSearchActive
                ? "text-accent"
                : "text-text-muted hover:text-text-primary dark:text-text-secondary dark:hover:text-text-primary"
            )}
          />
        </Link>
      </div>
    </nav>
  )
}
