"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DOCK_NAV_ITEMS } from "@/shared/config/nav"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"
import { useSearchFilterStore } from "@/shared/store/search-filter-store"

import { useUpdateStore } from "@/shared/store/update-store"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useMounted } from "@/shared/hooks/use-mounted"

export function BottomDock() {
  const pathname = usePathname()
  const mounted = useMounted()
  const unreadCount = useUpdateStore((state) => state.getUnreadCount())

  // Subscribe to these so the component re-renders when they change,
  // ensuring getUnreadCount() runs again with the fresh store states.
  useSettingsStore((state) => state.notifyForAllLibraryItems)
  useSettingsStore((state) => state.mutedMangaKeys)

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 w-full z-[var(--z-sticky)] pointer-events-none"
      style={{
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))"
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-md mx-auto items-center justify-center gap-3">
        <div className="flex-1 min-w-0 flex h-[56px] items-center justify-between gap-1 rounded-full bg-surface-glass backdrop-blur-md px-1.5 shadow-sm border border-border-default/30">
          {DOCK_NAV_ITEMS.filter(item => item.href !== '/settings').map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href)

            const Icon = item.icon
            const isUpdates = item.href === '/updates'
            const displayCount = unreadCount > 99 ? '99+' : unreadCount

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.href === "/search") {
                    useSearchFilterStore.getState().resetFilters();
                  }
                }}
                transitionTypes={['nav-lateral']}
                className={cn(
                  "group relative flex items-center justify-center h-[44px] shrink-0 outline-none tap-highlight-transparent transition-all duration-300 ease-out",
                  isActive ? "w-[120px]" : "w-[48px]"
                )}
                aria-label={isUpdates && unreadCount > 0 ? `${item.label}, ${unreadCount} unread updates` : item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-accent/15 dark:bg-accent/20 border border-accent/20"
                    initial={{ opacity: 0, scale: 0.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-center gap-2">
                  <div className="relative">
                    <Icon
                      weight={isActive ? "fill" : "regular"}
                      className={cn(
                        "transition-colors duration-300 shrink-0",
                        isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                      )}
                      style={{ width: 22, height: 22 }}
                    />
                    {mounted && isUpdates && unreadCount > 0 && (
                      <div
                        data-testid="updates-badge"
                        aria-hidden="true"
                        className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-primary flex items-center justify-center border-2 border-surface-base"
                      >
                        <span className="text-[9px] font-bold text-white leading-none">{displayCount}</span>
                      </div>
                    )}
                  </div>

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

        {/* Separate Floating Circle for Settings */}
        {DOCK_NAV_ITEMS.find(i => i.href === '/settings') && (() => {
          const item = DOCK_NAV_ITEMS.find(i => i.href === '/settings')!;
          const isActive = pathname?.startsWith('/settings');
          const SettingIcon = item.icon;

          return (
            <Link
              href="/settings"
              transitionTypes={['nav-lateral']}
              className={cn(
                "group relative flex h-[56px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md shadow-sm border border-border-default/30 transition-all duration-300 outline-none tap-highlight-transparent overflow-hidden",
                isActive ? "w-[128px]" : "w-[56px] text-text-secondary hover:text-text-primary"
              )}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-1.5 rounded-full bg-accent/15 dark:bg-accent/20 border border-accent/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-2">
                <SettingIcon
                  weight={isActive ? "fill" : "regular"}
                  style={{ width: 22, height: 22 }}
                  className={cn("shrink-0 transition-colors duration-300", isActive ? "text-accent" : "")}
                />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    className="text-[13px] font-bold tracking-wide whitespace-nowrap text-accent"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })()}
      </div>
    </nav>
  )
}
