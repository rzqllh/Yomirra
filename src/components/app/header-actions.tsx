"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, Gear } from "@phosphor-icons/react"
import { useUpdateStore } from "@/shared/store/update-store"
import { useMounted } from "@/shared/hooks/use-mounted"

import { cn } from "@/shared/utils/cn"

export function HeaderActions({ className }: { className?: string } = {}) {
  const mounted = useMounted()
  const rawUnread = useUpdateStore((state) => state.getUnreadCount())
  const unreadCount = typeof rawUnread === "function" ? (rawUnread as () => number)() : (Number(rawUnread) || 0)

  const displayCount = unreadCount > 99 ? "99+" : unreadCount
  const showBadge = mounted && unreadCount > 0
  const accessibleLabel = showBadge
    ? `Pembaruan, ${unreadCount} belum dibaca`
    : "Pembaruan"

  return (
    <div className={cn("flex md:hidden items-center gap-2 shrink-0", className)}>
      <Link
        href="/updates"
        transitionTypes={["nav-lateral"]}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-glass backdrop-blur-md border border-border-default/40 text-text-primary hover:bg-surface-hover hover:border-border-strong active:scale-95 transition-all outline-none select-none shadow-xs"
        aria-label={accessibleLabel}
      >
        <Bell size={20} weight={showBadge ? "fill" : "regular"} className="shrink-0" />
        {showBadge && (
          <div
            data-testid="updates-badge"
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-semantic-error text-white flex items-center justify-center border-2 border-surface-base shadow-xs animate-in zoom-in-50 duration-150"
          >
            <span className="text-[10px] font-bold text-white leading-none tracking-tight">
              {displayCount}
            </span>
          </div>
        )}
      </Link>

      <Link
        href="/settings"
        transitionTypes={["nav-lateral"]}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-glass backdrop-blur-md border border-border-default/40 text-text-primary hover:bg-surface-hover hover:border-border-strong active:scale-95 transition-all outline-none select-none shadow-xs"
        aria-label="Pengaturan"
      >
        <Gear size={20} weight="regular" className="shrink-0" />
      </Link>
    </div>
  )
}
