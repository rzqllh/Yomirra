"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "@phosphor-icons/react"
import { useUpdateStore } from "@/shared/store/update-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useMounted } from "@/shared/hooks/use-mounted"

export function UpdatesBell() {
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
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-glass backdrop-blur-md border border-border-default/40 text-text-primary hover:bg-surface-hover hover:border-border-strong active:scale-95 transition-all outline-none select-none shrink-0 shadow-xs"
      aria-label={accessibleLabel}
    >
      <Bell size={20} weight="bold" className="shrink-0" />
      {showBadge && (
        <div
          data-testid="updates-badge"
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary flex items-center justify-center border-2 border-surface-base shadow-xs"
        >
          <span className="text-[10px] font-black text-white leading-none">
            {displayCount}
          </span>
        </div>
      )}
    </Link>
  )
}
