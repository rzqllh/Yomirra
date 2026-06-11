"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  House,
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
    <nav className="md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-40">
      {/* ── Ambient glow (subtle, behind the glass) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 -inset-y-1 -z-10 rounded-full bg-accent/10 blur-2xl"
      />

      {/* ── Main glass pill ── */}
      <div className="relative flex h-[62px] items-center justify-around rounded-full border border-border-subtle/60 bg-surface-raised/[0.82] px-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">

        {/* Specular top-edge highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-px h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {NAV_ITEMS.map((item) => {
          // Exact same active logic as original
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href)

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex h-[50px] flex-1 flex-col items-center justify-center transition-transform duration-100 active:scale-[0.88]"
            >
              <div className="relative flex w-[58px] flex-col items-center justify-center gap-[3px] py-1.5">

                {/* ── Signature: two-layer floating indicator ── */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {/* Layer 1 — diffuse halo (bleeds past pill bounds) */}
                    <div className="absolute -inset-1 rounded-full bg-accent/10 blur-md" />
                    {/* Layer 2 — gradient pill surface */}
                    <div className="absolute inset-0 rounded-full border border-accent/20 bg-gradient-to-b from-accent/[0.22] to-accent/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_0_16px_rgba(255,255,255,0.04)]" />
                  </motion.div>
                )}

                {/* Icon — spring scale + float */}
                <motion.span
                  className="relative z-10"
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -0.5 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                >
                  <Icon
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "size-[22px] transition-colors duration-200",
                      isActive
                        ? "text-accent"
                        : "text-text-muted/70 group-hover:text-text-muted"
                    )}
                  />
                </motion.span>

                {/* Label — opacity + slide */}
                <motion.span
                  className={cn(
                    "relative z-10 select-none text-[9.5px] font-semibold leading-none tracking-[0.02em]",
                    isActive
                      ? "text-accent"
                      : "text-text-muted/60 group-hover:text-text-muted/80"
                  )}
                  animate={{ opacity: isActive ? 1 : 0.6, y: isActive ? 0 : 1 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {item.label}
                </motion.span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}