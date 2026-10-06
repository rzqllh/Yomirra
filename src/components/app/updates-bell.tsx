"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, ArrowRight, BookOpen } from "@phosphor-icons/react"
import { useUpdateStore } from "@/shared/store/update-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useMounted } from "@/shared/hooks/use-mounted"
import { getRelativeTime } from "@/shared/utils/date"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MangaCover } from "@/components/manga/manga-cover"
import { cn } from "@/shared/utils/cn"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"

export function UpdatesBell({ className }: { className?: string } = {}) {
  const mounted = useMounted()
  const rawUnread = useUpdateStore((state) => state.getUnreadCount?.())
  const unreadCount = typeof rawUnread === "function" ? (rawUnread as () => number)() : (Number(rawUnread) || 0)
  const itemsMap = useUpdateStore((state) => state.items)
  const markAllAsSeen = useUpdateStore((state) => state.markAllAsSeen)
  const reducedMotion = useReducedMotion()

  // Subscribe to settings stores for updates notification preferences
  useSettingsStore((state) => state.notifyForAllLibraryItems)
  useSettingsStore((state) => state.mutedMangaKeys)

  const [isOpen, setIsOpen] = React.useState(false)
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && typeof markAllAsSeen === "function") {
      markAllAsSeen()
    }
  }

  // Get recent updates sorted by detectedAt and deduplicated by manga key
  const recentUpdates = React.useMemo(() => {
    if (!itemsMap || typeof itemsMap !== "object") return []
    const list = Object.values(itemsMap).filter(
      (item) => Boolean(item && item.sourceId && item.mangaId && item.latestChapterId && !item.error)
    )

    const sorted = list.sort((a, b) => {
      const timeA = a.detectedAt ? new Date(a.detectedAt).getTime() : 0
      const timeB = b.detectedAt ? new Date(b.detectedAt).getTime() : 0
      return timeB - timeA
    })

    const seenManga = new Set<string>()
    const seenSaved = new Set<string>()
    const deduped: typeof list = []

    for (const item of sorted) {
      const mangaKey = `${item.sourceId}::${item.mangaId}`
      const savedKey = item.savedTitleId

      if (seenManga.has(mangaKey) || (savedKey && seenSaved.has(savedKey))) {
        continue
      }

      seenManga.add(mangaKey)
      if (savedKey) seenSaved.add(savedKey)
      deduped.push(item)
    }

    return deduped.slice(0, 5)
  }, [itemsMap])

  const displayCount = unreadCount > 99 ? "99+" : unreadCount
  const showBadge = mounted && unreadCount > 0
  const accessibleLabel = showBadge
    ? `Pembaruan, ${unreadCount} belum dibaca`
    : "Pembaruan"

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex size-9 items-center justify-center rounded-[10px] bg-surface-raised border border-border-subtle hover:border-accent/40 text-text-secondary hover:text-text-primary active:scale-95 transition-colors outline-none select-none shrink-0 shadow-xs cursor-pointer",
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
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-88 p-0 rounded-2xl bg-surface-overlay/95 backdrop-blur-xl border border-border-subtle shadow-xl overflow-hidden z-[100]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Bell size={16} weight="duotone" className="text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Notifikasi Pembaruan
            </h3>
          </div>
          {recentUpdates.length > 0 && (
            <span className="text-[11px] font-medium text-text-muted">
              {recentUpdates.length} terbaru
            </span>
          )}
        </div>

        <div className="max-h-[340px] overflow-y-auto divide-y divide-border-subtle/50 py-1">
          {recentUpdates.length === 0 ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
              <BookOpen size={32} weight="duotone" className="text-text-muted/60" />
              <p className="text-xs font-medium text-text-muted">
                Tidak ada pembaruan baru.
              </p>
            </div>
          ) : (
            recentUpdates.map((item) => {
              const chapterLabel =
                item.latestChapterTitle ||
                (item.latestChapterNumber ? `Ch. ${item.latestChapterNumber}` : "Chapter baru")
              const relativeTime = item.detectedAt ? getRelativeTime(item.detectedAt) : "Baru saja"
              const targetHref = item.latestChapterId
                ? `/manga/${item.sourceId}/${item.mangaId}/read/${item.latestChapterId}`
                : `/manga/${item.sourceId}/${item.mangaId}`

              const uniqueKey = item.savedTitleId ? `update-${item.savedTitleId}` : `update-${item.sourceId}::${item.mangaId}`

              return (
                <DropdownMenuItem asChild key={uniqueKey}>
                  <Link
                    href={targetHref}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-surface-hover/80 focus:bg-surface-hover transition-colors cursor-pointer group outline-none"
                  >
                    <div className="relative w-10 h-14 rounded-md overflow-hidden bg-surface-base shrink-0 border border-border-subtle shadow-xs">
                      <MangaCover
                        src={item.coverUrl}
                        alt={item.mangaTitle}
                        iconSize={16}
                        imageClassName="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate group-hover:text-accent transition-colors">
                        {item.mangaTitle || item.mangaId}
                      </p>
                      <p className="text-[11px] font-semibold text-text-secondary truncate mt-0.5">
                        {chapterLabel}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {relativeTime}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="p-1.5 bg-surface-raised/30">
          <DropdownMenuItem asChild>
            <Link
              href="/updates"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-accent hover:text-accent-hover hover:bg-accent-dim focus:bg-accent-dim focus:text-accent-hover transition-colors cursor-pointer outline-none"
            >
              <span>Tampilkan semua notifikasi</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
