"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  House,
  BookBookmark,
  Books,
  ClockCounterClockwise,
  Gear,
} from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 pointer-events-none px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="pointer-events-auto mx-auto flex max-w-sm items-center justify-between rounded-[2rem] bg-background/95 backdrop-blur-xl border border-border-subtle p-2 shadow-lg">
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
              className="relative flex flex-col items-center justify-center min-w-[4rem] h-[3.25rem] transition-transform active:scale-95 outline-none tap-highlight-transparent"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Animated Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 rounded-full bg-accent/15"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <div className="relative z-10 w-full h-full">
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 transition-all duration-300",
                    isActive ? "top-[6px] text-accent scale-110" : "top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary scale-100"
                  )}
                  style={{ width: 22, height: 22 }}
                />
                
                <span
                  className={cn(
                    "absolute bottom-[5px] left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide transition-all duration-300 whitespace-nowrap",
                    isActive ? "text-accent opacity-100 translate-y-0" : "text-text-muted opacity-0 translate-y-2 pointer-events-none"
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