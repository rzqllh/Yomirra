"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "@phosphor-icons/react"
import { useUpdateStore } from "@/shared/store/update-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useMounted } from "@/shared/hooks/use-mounted"

export function UpdatesBell() {
  const mounted = useMounted()
  const unreadCount = useUpdateStore((state) => state.getUnreadCount())

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
      className="relative flex items-center justify-center min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-surface-hover transition-colors outline-none tap-highlight-transparent shrink-0"
      aria-label={accessibleLabel}
    >
      <Bell size={22} weight="regular" className="shrink-0" />
      {showBadge && (
        <div
          data-testid="updates-badge"
          aria-hidden="true"
          className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-primary flex items-center justify-center border-2 border-surface-base"
        >
          <span className="text-[9px] font-bold text-white leading-none">
            {displayCount}
          </span>
        </div>
      )}
    </Link>
  )
}
