"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeft } from "@phosphor-icons/react"
import { HeaderActions } from "@/components/app/header-actions"
import { cn } from "@/shared/utils/cn"

export interface PageHeaderProps {
  /** Main section title */
  title: string
  /** Section description or subtitle */
  description?: React.ReactNode
  /** Canonical alias for description */
  subtitle?: React.ReactNode
  /** Section icon element */
  icon?: React.ReactNode
  /** Show back button on mobile header */
  showBack?: boolean
  /** Back button navigation target */
  backHref?: string
  /** Mobile header action elements (buttons, links, triggers; defaults to <HeaderActions />) */
  actions?: React.ReactNode
  /** Optional custom action elements for desktop header banner (e.g. filter buttons, refresh) */
  desktopActions?: React.ReactNode
  /** Compositional meta elements (counters, badges, filters status) */
  meta?: React.ReactNode
  /** Header behavior mode: standard (title always visible) or detail (title collapses on top) */
  mode?: "standard" | "detail"
  /** Mobile header background variant */
  variant?: "transparent" | "glass" | "auto"
  /** Hide desktop banner when desktop has separate editorial header (e.g. Beranda) */
  hideDesktop?: boolean
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
  subtitle,
  icon,
  showBack = false,
  backHref,
  actions = <HeaderActions />,
  desktopActions,
  meta,
  mode = "standard",
  variant = "auto",
  hideDesktop = false,
  className,
}: PageHeaderProps) {
  const router = useRouter()
  const [scrollY, setScrollY] = React.useState(0)
  const sub = subtitle ?? description

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
                className="flex size-10 items-center justify-center rounded-2xl liquid-glass text-text-primary active:scale-95 transition-all shrink-0 select-none outline-none cursor-pointer"
                aria-label="Kembali"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
            ) : (
              icon && (
                <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 via-accent/10 to-transparent border border-accent/25 text-accent shadow-xs shrink-0 select-none">
                  {icon}
                </div>
              )
            )}

            <div
              className={cn(
                "flex flex-col min-w-0 flex-1 transition-all duration-300 ease-out",
                !isTitleVisible
                  ? "opacity-0 pointer-events-none -translate-y-1"
                  : "opacity-100 translate-y-0"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-[15px] sm:text-base font-bold tracking-tight text-text-primary truncate select-none">
                  {title}
                </h2>
                {meta && (
                  <div className="shrink-0 inline-flex items-center text-xs font-bold text-text-muted">
                    {meta}
                  </div>
                )}
              </div>
              {sub && (
                <p className="text-[11px] font-medium text-text-muted truncate leading-snug mt-0.5 select-none">
                  {sub}
                </p>
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

      {/* Skipped for mode="detail" or hideDesktop — detail pages have their own hero, and some pages (Beranda) have dedicated desktop layouts */}
      {mode !== "detail" && !hideDesktop && (
        <div
          className={cn(
            "hidden md:block relative border-b border-border-subtle px-0 pt-1 pb-6 mb-7",
            className
          )}
        >
          <div className="relative flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {icon && (
                <div className="shrink-0 p-3 bg-accent/10 rounded-xl border border-accent/20 text-accent">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-[30px] font-black tracking-tight text-text-primary truncate">
                    {title}
                  </h1>
                  {meta && (
                    <div className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface-base border border-border-default/60 text-xs font-bold text-text-muted">
                      {meta}
                    </div>
                  )}
                </div>
                {sub && (
                  <p className="text-text-muted mt-1 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                    {sub}
                  </p>
                )}
              </div>
            </div>
            {desktopActions && <div className="shrink-0">{desktopActions}</div>}
          </div>
        </div>
      )}
    </>
  )
}

