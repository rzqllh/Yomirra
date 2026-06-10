"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  House,
  Compass,
  BookBookmark,
  Books,
  ClockCounterClockwise,
  Gear,
} from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

const NAV_ITEMS = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Books, label: "Library" },
  { href: "/readlist", icon: BookBookmark, label: "Readlist" },
  { href: "/history", icon: ClockCounterClockwise, label: "Riwayat" },
  { href: "/settings", icon: Gear, label: "Pengaturan" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 flex h-[60px] items-center justify-around rounded-full border border-border-subtle/50 bg-surface-raised/90 px-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      {NAV_ITEMS.map((item) => {
        // Simple active check. Can be enhanced for nested routes if needed.
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname?.startsWith(item.href)

        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex h-[48px] flex-1 flex-col items-center justify-center transition-all duration-300 active:scale-95"
          >
            <div className={cn(
              "relative flex w-[64px] flex-col items-center justify-center gap-1 rounded-full py-1.5 transition-all duration-300",
              isActive
                ? "text-accent"
                : "text-text-muted hover:text-text-primary"
            )}>
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 z-0 rounded-full bg-accent/15 shadow-[inset_0_0_12px_rgba(255,255,255,0.1)]"
                  transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
                />
              )}
              <Icon
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "relative z-10 size-[22px] transition-all duration-300",
                  isActive ? "scale-110 drop-shadow-sm" : "group-hover:scale-110 group-active:scale-95"
                )}
              />
              <span className={cn(
                "relative z-10 text-[10px] font-bold leading-none transition-all duration-300",
                isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100 group-active:opacity-80"
              )}>
                {item.label}
              </span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
