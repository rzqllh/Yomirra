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

  // Primary 4 tabs only: Beranda, Library, Bookmark, Cari
  const navItems = DOCK_NAV_ITEMS.filter((item) => item.href !== "/settings")

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 w-full z-[var(--z-sticky)] pointer-events-none"
      style={{
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-[360px] mx-auto items-center justify-center">
        <div className="grid grid-cols-4 w-full h-[64px] items-center gap-1 rounded-[24px] liquid-glass p-1.5 transition-all duration-300 ease-out">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.href === "/search") {
                    useSearchFilterStore.getState().resetFilters()
                  }
                }}
                transitionTypes={["nav-lateral"]}
                className="group relative flex flex-col items-center justify-center h-full rounded-[20px] outline-none tap-highlight-transparent transition-all duration-200 ease-out active:scale-95 select-none"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-[20px] bg-accent/15 border border-accent/25 shadow-xs"
                    layoutId="active-dock-tab"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <Icon
                    icon={item.icon}
                    size={20}
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "transition-colors duration-200 shrink-0",
                      isActive
                        ? "text-accent"
                        : "text-text-secondary group-hover:text-text-primary"
                    )}
                  />

                  <span
                    className={cn(
                      "text-[10px] tracking-tight leading-none transition-colors duration-200",
                      isActive
                        ? "font-bold text-accent"
                        : "font-medium text-text-muted group-hover:text-text-secondary"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
