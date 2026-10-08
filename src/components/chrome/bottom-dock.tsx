"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { DOCK_NAV_ITEMS } from "@/shared/config/nav"
import { cn } from "@/shared/utils/cn"
import { useSearchFilterStore } from "@/shared/store/search-filter-store"
import { Icon } from "@/components/ui/icon"
import { beginNavigationIntent, getNavigationPathname } from "@/shared/lib/navigation-intent"
import { transitions } from "@/shared/lib/motion/tokens"

export function BottomDock({ pendingHref }: { pendingHref?: string | null }) {
  const pathname = usePathname()
  const activePathname = pendingHref ? getNavigationPathname(pendingHref) : pathname

  // Keep the existing four primary destinations and detached search action.
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
      aria-label="Navigasi utama"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-sticky)] w-full md:hidden"
      style={{
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center justify-center gap-2 max-[359px]:gap-1.5">
        <div className="yomirra-chrome flex h-14 min-w-0 items-center justify-center gap-0.5 rounded-full px-1 py-1 sm:gap-1 sm:px-1.5">
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
                  "group relative flex h-11 items-center justify-center rounded-full outline-none transition-all duration-200 ease-out select-none tap-highlight-transparent active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isActive
                    ? "shrink-0 px-2.5 min-[360px]:px-3 sm:px-3.5"
                    : "size-11 shrink-0"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-accent-dim"
                    layoutId="active-dock-tab"
                    transition={transitions.layout}
                  />
                )}

                <span className="relative z-10 flex w-full items-center justify-center gap-1.5">
                  <Icon
                    icon={item.icon}
                    size={isActive ? 18 : 20}
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "transition-colors duration-200 shrink-0",
                      isActive
                        ? "text-accent"
                        : "text-text-muted group-hover:text-text-primary"
                    )}
                  />

                  {isActive && (
                    <span className="whitespace-nowrap text-[11px] min-[360px]:text-[12px] font-semibold leading-none tracking-tight text-text-primary">
                      {item.label}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>

        <Link
          href={searchItem.href}
          onClick={(event) => {
            if (isSearchActive || !beginNavigationIntent(searchItem.href)) {
              event.preventDefault()
              return
            }
            useSearchFilterStore.getState().resetFilters()
          }}
          className="yomirra-chrome relative flex size-14 shrink-0 items-center justify-center rounded-full outline-none transition-transform duration-200 ease-out select-none tap-highlight-transparent active:scale-95 motion-reduce:transition-none max-[359px]:size-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={searchItem.label}
          aria-current={isSearchActive ? "page" : undefined}
        >
          {isSearchActive && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-1 rounded-full bg-accent-dim"
              layoutId="active-dock-tab"
              transition={transitions.layout}
            />
          )}
          <Icon
            icon={searchItem.icon}
            size={21}
            weight={isSearchActive ? "bold" : "regular"}
            className={cn(
              "relative z-10 transition-colors duration-200",
              isSearchActive
                ? "text-accent"
                : "text-text-muted hover:text-text-primary"
            )}
          />
        </Link>
      </div>
    </nav>
  )
}
