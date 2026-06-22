"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DOCK_NAV_ITEMS } from "@/shared/config/nav"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

export function YomirraBottomDock() {
  const pathname = usePathname()

  return (
    <nav 
      className="md:hidden fixed bottom-6 left-0 w-full z-[var(--z-sticky)] pointer-events-none px-4"
      style={{ viewTransitionName: 'persistent-bottom-nav' }}
    >
      <div className="mx-auto flex w-fit max-w-full items-center justify-center gap-3">
        {/* Ultra-modern Expanding Floating Pill */}
        <div className="pointer-events-auto flex h-[56px] w-fit items-center justify-between gap-1 rounded-full bg-surface-glass backdrop-blur-md px-1.5 shadow-sm --glass border border-border-default/30">
          {DOCK_NAV_ITEMS.filter(item => item.href !== '/search').map((item) => {
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
                  "group relative flex items-center justify-center h-[44px] outline-none tap-highlight-transparent transition-all duration-300 ease-out",
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

        {/* Separate Floating Search Circle */}
        {DOCK_NAV_ITEMS.find(i => i.href === '/search') && (() => {
          const item = DOCK_NAV_ITEMS.find(i => i.href === '/search')!;
          const isActive = pathname?.startsWith('/search');
          const SearchIcon = item.icon;

          return (
            <Link
              href="/search"
              prefetch={false}
              transitionTypes={['nav-lateral']}
              className={cn(
                "group relative pointer-events-auto flex h-[56px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md shadow-sm --glass border border-border-default/30 transition-all duration-300 outline-none tap-highlight-transparent overflow-hidden",
                isActive ? "w-auto px-5" : "w-[56px] text-text-secondary hover:text-text-primary"
              )}
              aria-label="Pencarian"
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
                <SearchIcon 
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
