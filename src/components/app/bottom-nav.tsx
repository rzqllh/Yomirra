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
    <nav style={{ viewTransitionName: 'persistent-bottom-nav' }} className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[var(--z-sticky)] pointer-events-none px-4 pb-[calc(var(--safe-bottom)+16px)]">
      <div className="pointer-events-auto mx-auto flex h-[64px] w-full max-w-[380px] items-center justify-between rounded-full bg-surface-base/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-surface-base/65 border border-border-glass shadow-glass px-1.5">
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
              className="group relative flex flex-col items-center justify-center w-full h-full min-w-0 transition-transform active:scale-95 outline-none tap-highlight-transparent"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active Indicator Pill */}
              <div
                className={cn(
                  "absolute top-[6px] h-[30px] w-[50px] rounded-full transition-all duration-300 ease-out",
                  isActive ? "bg-accent/15 scale-100 opacity-100" : "bg-transparent scale-90 opacity-0"
                )}
              />

              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pt-1">
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                  )}
                  style={{ width: 24, height: 24 }}
                />

                <span
                  className={cn(
                    "mt-1 text-2xs font-bold tracking-wide transition-colors duration-200",
                    isActive ? "text-accent" : "text-text-muted"
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