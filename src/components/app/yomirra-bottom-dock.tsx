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
import { motion } from "motion/react"

const NAV_ITEMS = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Books, label: "Library" },
  { href: "/sources", icon: Compass, label: "Sumber" },
  { href: "/bookmark", icon: BookmarkSimple, label: "Bookmark" },
  { href: "/settings", icon: Gear, label: "Pengaturan" },
]

export function YomirraBottomDock() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-6 left-0 w-full z-[var(--z-sticky)] pointer-events-none px-4">
      {/* Ultra-modern Expanding Floating Pill */}
      <div className="pointer-events-auto mx-auto flex h-[56px] w-fit min-w-[280px] max-w-full items-center justify-between gap-1 rounded-full bg-surface-glass backdrop-blur-md border border-border-glass shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-1.5">
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
              className={cn(
                "group relative flex items-center  justify-center h-[44px] outline-none tap-highlight-transparent transition-all duration-300 ease-out",
                isActive ? "px-4" : "px-3 w-[44px]"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-accent/15 dark:bg-accent/20 border border-accent/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center gap-2">
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors duration-300 shrink-0",
                    isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                  )}
                  style={{ width: 22, height: 22 }}
                />

                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    className="text-[12px] font-bold tracking-wide text-accent whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
