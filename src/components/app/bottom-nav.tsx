"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  House,
  Compass,
  Books,
  Gear,
  BookmarkSimple,
} from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

const NAV_ITEMS = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Books, label: "Library" },
  { href: "/sources", icon: Compass, label: "Sumber" },
  { href: "/bookmark", icon: BookmarkSimple, label: "Bookmark" },
  { href: "/settings", icon: Gear, label: "Pengaturan" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{ viewTransitionName: 'persistent-bottom-nav' }} className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[var(--z-sticky)] pointer-events-none px-4 pb-[calc(var(--safe-bottom)+12px)]">
      <div className="pointer-events-auto mx-auto flex h-[var(--bottom-nav-content-height)] w-full max-w-sm items-center justify-between rounded-[var(--radius-full)] bg-surface-overlay/80 backdrop-blur-xl border border-border-default px-2 shadow-lg ring-1 ring-black/5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href)

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              transitionTypes={['nav-lateral']}
              className="relative flex flex-col items-center justify-center min-w-[4rem] h-[3.25rem] transition-transform active:scale-95 outline-none tap-highlight-transparent "
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Static Background Pill with Opacity Transition */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-accent-dim  transition-opacity duration-200 ",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />

              <div className="relative z-10 w-full h-full ">
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 transition-all duration-150 ",
                    isActive
                      ? "top-[6px] text-accent scale-110 "
                      : "top-1/2 -translate-y-1/2 text-text-primary hover:text-text-primary scale-100"
                  )}
                  style={{ width: 22, height: 22 }}
                />

                <span
                  className={cn(
                    "absolute bottom-[5px] left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide transition-all duration-150 whitespace-nowrap ",
                    isActive
                      ? "text-accent opacity-100 translate-y-0"
                      : "text-text-muted opacity-0 translate-y-2 pointer-events-none"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}