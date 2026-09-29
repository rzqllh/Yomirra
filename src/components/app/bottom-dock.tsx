"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DOCK_NAV_ITEMS } from "@/shared/config/nav"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"
import { useSearchFilterStore } from "@/shared/store/search-filter-store"
import { Icon } from "@/components/ui/icon"
import { beginNavigationIntent, getNavigationPathname } from "@/shared/lib/navigation-intent"

export function BottomDock({ pendingHref }: { pendingHref?: string | null }) {
  const pathname = usePathname()
  const activePathname = pendingHref ? getNavigationPathname(pendingHref) : pathname

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
    if (href === "/") return activePathname === "/"
    return activePathname?.startsWith(href)
  }

  const isSearchActive = activePathname === "/search" || activePathname?.startsWith("/search")

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 w-full z-[var(--z-sticky)] pointer-events-none"
      style={{
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-[404px] mx-auto items-center justify-center gap-2">
        {/* Main Dock Capsule */}
        <div className="yomirra-chrome flex-1 h-[56px] flex items-center justify-between gap-1 rounded-full p-1.5 transition-colors duration-200">
          {mainItems.map((item) => {
            const isActive = isMainTabActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  if (isActive || !beginNavigationIntent(item.href)) {
                    event.preventDefault()
                  }
                }}
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
                    className="absolute inset-0 rounded-full border border-accent/25 bg-accent-dim shadow-xs"
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
          onClick={(event) => {
            if (isSearchActive || !beginNavigationIntent(searchItem.href)) {
              event.preventDefault()
              return
            }
            useSearchFilterStore.getState().resetFilters()
          }}
          className={cn(
            "yomirra-chrome relative flex items-center justify-center size-[56px] shrink-0 rounded-full outline-none tap-highlight-transparent transition-all duration-200 ease-out active:scale-95 select-none",
            isSearchActive && "border-accent/30 bg-accent-dim"
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
