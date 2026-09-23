"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeft } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

export interface PageHeaderProps {
  /** Main section title */
  title: string
  /** Section description or subtitle */
  description?: React.ReactNode
  /** Section icon element */
  icon?: React.ReactNode
  /** Show back button on mobile header */
  showBack?: boolean
  /** Back button navigation target */
  backHref?: string
  /** Header action elements (buttons, links, triggers) */
  actions?: React.ReactNode
  /** Compositional meta elements (counters, badges, filters status) */
  meta?: React.ReactNode
  /** Header behavior mode: standard (title always visible) or detail (title collapses on top) */
  mode?: "standard" | "detail"
  /** Mobile header background variant */
  variant?: "transparent" | "glass" | "auto"
  /** Outer wrapper className override */
  className?: string
}

/**
 * Canonical Section / Destination Page Header for Yomirra.
 * Encapsulates responsive mobile navigation bar and desktop hero section title.
 */
export function PageHeader({
  title,
  description,
  icon,
  showBack = false,
  backHref,
  actions,
  meta,
  mode = "standard",
  variant = "auto",
  className,
}: PageHeaderProps) {
  const router = useRouter()
  const [scrollY, setScrollY] = React.useState(0)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else if (typeof window !== "undefined" && window.history.length > 2) {
      // Only use router.back() if we are deep enough in the history stack (length > 2).
      // If length is 1 or 2, we might be on the first page load or just one step away,
      // where router.back() can get stuck or behave like a refresh.
      router.back()
    } else {
      router.push("/")
    }
  }

  // Header surface glass state & title visibility threshold
  // For detail mode: title only reveals once hero cover has scrolled fully past (~320px) to prevent redundancy
  const isScrolled = scrollY > 20
  const isTitleVisible = mode === "detail" ? scrollY > 320 : true
  const isGlass =
    variant === "glass" ||
    (variant === "auto" && (mode === "detail" ? isTitleVisible : isScrolled))
  const isTransparent = variant === "transparent" || (variant === "auto" && !isGlass)

  return (
    <>
      <header
        className={cn(
          "md:hidden fixed top-0 left-0 right-0 z-[var(--z-sticky)] flex w-full flex-col justify-end px-4 pt-[calc(var(--safe-top,0px)+8px)] pb-2 transition-all duration-300 ease-out pointer-events-none bg-transparent",
          className
        )}
      >
        <div className="flex items-center justify-between w-full transition-all duration-300 ease-out pointer-events-auto h-10">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex h-10 w-10 items-center justify-center rounded-[12px] liquid-glass text-text-primary active:scale-95 transition-all shrink-0 select-none outline-none cursor-pointer"
                aria-label="Kembali"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
            ) : (
              icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-accent/15 via-accent/10 to-transparent border border-accent/25 text-accent shadow-xs shrink-0 select-none">
                  {icon}
                </div>
              )
            )}

            <div
              className={cn(
                "flex items-center gap-2 min-w-0 flex-1 transition-all duration-300 ease-out",
                !isTitleVisible
                  ? "opacity-0 pointer-events-none -translate-y-1"
                  : "opacity-100 translate-y-0"
              )}
            >
              <h2 className="text-[15px] sm:text-base font-bold tracking-tight text-text-primary truncate select-none">
                {title}
              </h2>
              {meta && (
                <div className="shrink-0 inline-flex items-center text-xs font-bold text-text-muted">
                  {meta}
                </div>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* Skipped for mode="detail" — detail pages have their own full hero with h1 */}
      {mode !== "detail" && (
        <div
          className={cn(
            "hidden md:block relative overflow-hidden rounded-3xl bg-surface-raised/40 border border-border-default/50 p-6 md:p-8 mb-6 md:mb-8 backdrop-blur-md shadow-xs",
            className
          )}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {icon && (
                <div className="shrink-0 p-3.5 bg-gradient-to-br from-accent/15 via-accent/10 to-transparent rounded-2xl shadow-xs border border-accent/25 text-accent">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary truncate">
                    {title}
                  </h1>
                  {meta && (
                    <div className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface-base border border-border-default/60 text-xs font-bold text-text-muted">
                      {meta}
                    </div>
                  )}
                </div>
                {description && (
                  <p className="text-text-muted mt-1 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </div>
      )}
    </>
  )
}


