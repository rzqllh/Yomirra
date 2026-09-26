"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "@phosphor-icons/react"
import { useUpdateStore } from "@/shared/store/update-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useMounted } from "@/shared/hooks/use-mounted"

import { cn } from "@/shared/utils/cn"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"

export function UpdatesBell({ className }: { className?: string } = {}) {
  const mounted = useMounted()
  const rawUnread = useUpdateStore((state) => state.getUnreadCount())
  const unreadCount = typeof rawUnread === "function" ? (rawUnread as () => number)() : (Number(rawUnread) || 0)
  const reducedMotion = useReducedMotion()

  // Subscribe to settings stores for updates notification preferences
  useSettingsStore((state) => state.notifyForAllLibraryItems)
  useSettingsStore((state) => state.mutedMangaKeys)

  const prevCountRef = React.useRef(unreadCount)
  const [isWiggling, setIsWiggling] = React.useState(false)

  React.useEffect(() => {
    if (mounted && unreadCount > prevCountRef.current && !reducedMotion) {
      setIsWiggling(true)
      const timer = setTimeout(() => setIsWiggling(false), 400)
      prevCountRef.current = unreadCount
      return () => clearTimeout(timer)
    }
    prevCountRef.current = unreadCount
  }, [unreadCount, mounted, reducedMotion])

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
        "relative flex size-9 items-center justify-center rounded-[10px] bg-surface-raised border border-border-subtle hover:border-accent/40 text-text-secondary hover:text-text-primary active:scale-95 transition-colors outline-none select-none shrink-0 shadow-xs",
        className
      )}
      aria-label={accessibleLabel}
    >
      <motion.span
        animate={isWiggling && !reducedMotion ? { rotate: [0, -8, 8, -6, 6, 0] } : { rotate: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex items-center justify-center shrink-0 origin-top"
      >
        <Bell size={20} weight={showBadge ? "fill" : "regular"} className="shrink-0" />
      </motion.span>
      <AnimatePresence>
        {showBadge && (
          <motion.div
            key="badge"
            data-testid="updates-badge"
            aria-hidden="true"
            initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? undefined : { scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-semantic-error text-white flex items-center justify-center border-2 border-surface-base shadow-xs"
          >
            <motion.span
              key={displayCount}
              initial={reducedMotion ? false : { scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] font-bold text-white leading-none tracking-tight"
            >
              {displayCount}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  )
}
