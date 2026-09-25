"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "@phosphor-icons/react"
import { useUpdateStore } from "@/shared/store/update-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useMounted } from "@/shared/hooks/use-mounted"

import { cn } from "@/shared/utils/cn"

export function UpdatesBell({ className }: { className?: string } = {}) {
  const mounted = useMounted()
  const rawUnread = useUpdateStore((state) => state.getUnreadCount())
  const unreadCount = typeof rawUnread === "function" ? (rawUnread as () => number)() : (Number(rawUnread) || 0)

  // Subscribe to settings stores for updates notification preferences
  useSettingsStore((state) => state.notifyForAllLibraryItems)
  useSettingsStore((state) => state.mutedMangaKeys)

  const displayCount = unreadCount > 99 ? "99+" : unreadCount
  const showBadge = mounted && unreadCount > 0
  const accessibleLabel = showBadge
    ? `Pembaruan, ${unreadCount} belum dibaca`
    : "Pembaruan"

  return (
    <Link
      href="/updates"
      transitionTypes={["nav-lateral"]}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-[10px] bg-surface-raised border border-border-subtle hover:border-accent/40 text-text-secondary hover:text-text-primary active:scale-95 transition-all outline-none select-none shrink-0 shadow-xs",
        className
      )}
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
  )
}
