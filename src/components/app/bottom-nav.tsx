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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-raised)] flex h-[calc(56px+env(safe-area-inset-bottom))] w-full items-start justify-around border-t border-border-subtle bg-surface-base pb-[env(safe-area-inset-bottom)]">
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
            className={cn(
              "relative flex h-[56px] flex-1 flex-col items-center justify-center gap-1",
              isActive
                ? "text-accent"
                : "text-text-muted transition-colors hover:text-text-secondary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-x-3 inset-y-1 z-0 rounded-full bg-accent-muted"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon
              weight={isActive ? "fill" : "regular"}
              className="relative z-10 size-6"
            />
            <span className="relative z-10 text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
