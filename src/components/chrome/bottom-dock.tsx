"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef } from "react"
import { DOCK_NAV_ITEMS } from "@/shared/config/nav"
import { cn } from "@/shared/utils/cn"
import { useSearchFilterStore } from "@/shared/store/search-filter-store"
import { Icon } from "@/components/ui/icon"
import { beginNavigationIntent, getNavigationPathname } from "@/shared/lib/navigation-intent"

export function BottomDock({ pendingHref }: { pendingHref?: string | null }) {
  const pathname = usePathname()
  const activePathname = pendingHref ? getNavigationPathname(pendingHref) : pathname

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

  const dockRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const dock = dockRef.current
    const pill = pillRef.current
    const link = dock?.querySelector<HTMLAnchorElement>('[aria-current="page"]')
    if (!dock || !pill || !link) {
      pill?.removeAttribute("data-visible")
      return
    }

    const measure = () => {
      const dockBox = dock.getBoundingClientRect()
      const linkBox = link.getBoundingClientRect()
      const inset = isSearchActive ? (linkBox.width - pill.offsetHeight) / 2 : 0
      pill.style.width = `${linkBox.width - 2 * inset}px`
      pill.style.transform = `translateX(${linkBox.left - dockBox.left + inset}px)`
      pill.dataset.visible = ""
    }

    measure()
    const frame = requestAnimationFrame(() => { pill.dataset.positioned = "" })
    if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(frame)

    const observer = new ResizeObserver(measure)
    observer.observe(dock)
    observer.observe(link)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [activePathname, isSearchActive])


  return (
    <nav
      aria-label="Navigasi utama"
      className="yomirra-dock-frame pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-sticky)] w-full md:hidden"
    >
      <div ref={dockRef} className="pointer-events-auto relative mx-auto flex w-fit max-w-full items-center justify-center gap-2 max-[359px]:gap-1.5">
        <span ref={pillRef} aria-hidden="true" className="yomirra-dock-pill yomirra-dock-indicator" />
        <div className="yomirra-dock-surface relative flex border border-transparent min-w-0 items-center justify-center gap-0.5 min-[360px]:gap-1 sm:gap-1.5">
          <span aria-hidden="true" className="yomirra-chrome yomirra-dock-glass absolute inset-0 rounded-full" />
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
                  "group relative flex h-11 items-center justify-center rounded-full outline-none select-none tap-highlight-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isActive
                    ? "shrink-0 px-2 min-[360px]:px-3 sm:px-3.5"
                    : "size-11 shrink-0"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative z-10 flex w-full items-center justify-center gap-1 min-[360px]:gap-1.5">
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
          className="yomirra-dock-surface relative flex border border-transparent w-[var(--dock-height)] shrink-0 items-center justify-center rounded-full outline-none select-none tap-highlight-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={searchItem.label}
          aria-current={isSearchActive ? "page" : undefined}
        >
          <span aria-hidden="true" className="yomirra-chrome yomirra-dock-glass absolute inset-0 rounded-full" />
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
