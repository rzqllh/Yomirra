"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeft, MagnifyingGlass } from "@phosphor-icons/react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { IconButton } from "@/components/ui/icon-button"
import { HeaderActions } from "./header-actions"
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
  /** Hero-title element observed in detail mode before showing the sticky title */
  detailTitleAnchorId?: string
  /** Hero-search element observed in home mode before morphing the title into sticky search pill */
  heroSearchAnchorId?: string
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
  detailTitleAnchorId,
  heroSearchAnchorId,
  hideDesktop = false,
  className,
}: PageHeaderProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [detailTitleVisible, setDetailTitleVisible] = React.useState(false)
  const [heroSearchPast, setHeroSearchPast] = React.useState(false)
  const sub = subtitle ?? description

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    if (!heroSearchAnchorId) {
      setHeroSearchPast(false)
      return
    }

    const updateVisibility = () => {
      const el = document.getElementById(heroSearchAnchorId)
      if (!el) {
        setHeroSearchPast(window.scrollY > 100)
        return
      }
      const rect = el.getBoundingClientRect()
      // Mobile header is 56px tall. When hero search scrolls past the top bar, show search pill.
      const isPast = rect.bottom < 56 && window.scrollY > 40
      setHeroSearchPast(isPast)
    }

    let observer: IntersectionObserver | null = null
    const el = document.getElementById(heroSearchAnchorId)
    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        () => {
          updateVisibility()
        },
        {
          threshold: 0,
          rootMargin: "-56px 0px 0px 0px",
        }
      )
      observer.observe(el)
    }

    window.addEventListener("scroll", updateVisibility, { passive: true })
    updateVisibility()

    return () => {
      observer?.disconnect()
      window.removeEventListener("scroll", updateVisibility)
    }
  }, [heroSearchAnchorId])

  React.useEffect(() => {
    if (mode !== "detail") {
      setDetailTitleVisible(false)
      return
    }

    const desktopAnchor = document.getElementById("manga-detail-title-desktop")
    const mobileAnchor = detailTitleAnchorId
      ? document.getElementById(detailTitleAnchorId)
      : null

    const anchors = [desktopAnchor, mobileAnchor].filter(Boolean) as HTMLElement[]
    if (anchors.length === 0 || typeof IntersectionObserver === "undefined") {
      setDetailTitleVisible(false)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768
        const targetEntry = isDesktop
          ? entries.find((e) => e.target.id === "manga-detail-title-desktop") || entries[0]
          : entries.find((e) => e.target.id === detailTitleAnchorId) || entries[0]
        if (targetEntry) {
          setDetailTitleVisible(!targetEntry.isIntersecting)
        }
      },
      {
        threshold: 0,
        rootMargin: "-56px 0px 0px 0px",
      }
    )
    anchors.forEach((a) => observer.observe(a))
    return () => observer.disconnect()
  }, [detailTitleAnchorId, mode])

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      // Prefer the browser history entry so Back/Forward keeps native scroll
      // restoration. Reader routes now replace their detail slot, so the
      // previous entry is the logical parent instead of a stale reader page.
      router.back()
      return
    }

    if (backHref) {
      router.replace(backHref)
      return
    }

    router.replace("/")
  }

  // Glass reacts to scroll, while detail-title visibility is tied to the actual
  // hero title leaving the viewport rather than a viewport-specific magic number.
  const isTitleVisible = mode === "detail" ? detailTitleVisible : true
  const isGlass =
    variant === "glass" ||
    (variant === "auto" && isScrolled)
  const isTransparent = variant === "transparent" || (variant === "auto" && !isGlass)

  return (
    <>
      <header
        style={{ top: "var(--announcement-height, 0px)" }}
        className={cn(
          "md:hidden fixed left-0 right-0 z-[var(--z-sticky)] flex w-full flex-col justify-end px-4 pt-[calc(var(--safe-top,0px)+8px)] pb-2 transition-[background-color,border-color,box-shadow,backdrop-filter,top] duration-200 ease-out pointer-events-none",
          isGlass && "yomirra-chrome border-x-0 border-t-0 rounded-none",
          isTransparent && "bg-transparent border-transparent shadow-none backdrop-blur-none",
          className
        )}
      >
        <div className="flex items-center justify-between w-full transition-all duration-300 ease-out pointer-events-auto h-11">
          <div className="flex items-center flex-1 min-w-0 overflow-hidden">
            <AnimatePresence initial={false}>
              {heroSearchAnchorId && heroSearchPast ? (
                <motion.div
                  key="header-search-pill"
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 28 }
                  }
                  className="flex-1 min-w-0 pr-1"
                >
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("open-command-menu"))
                    }
                    className="flex items-center gap-2.5 h-10 w-full px-3 rounded-sm border border-border-subtle bg-surface-raised/90 text-text-muted hover:text-text-primary text-xs font-semibold backdrop-blur-md shadow-xs active:scale-[0.98] transition-all cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-accent select-none"
                    aria-label="Cari komik"
                  >
                    <MagnifyingGlass
                      size={16}
                      weight="regular"
                      className="text-text-muted shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">Cari komik…</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="header-default-title"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.18, ease: "easeOut" }
                  }
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  {showBack ? (
                    <IconButton
                      type="button"
                      onClick={handleBack}
                      variant="ghost"
                      className={cn(
                        "flex size-11 items-center justify-center rounded-sm active:scale-95 transition-all shrink-0 select-none outline-none cursor-pointer",
                        mode === "detail" && !isGlass
                          ? "bg-scrim/60 hover:bg-scrim/80 text-on-cover backdrop-blur-md border border-border-glass shadow-sm"
                          : "yomirra-chrome-control text-text-primary"
                      )}
                      aria-label="Kembali"
                    >
                      <CaretLeft size={20} weight="regular" />
                    </IconButton>
                  ) : (
                    icon && (
                      <div className="yomirra-chrome-control flex size-11 items-center justify-center rounded-xl text-accent shrink-0 select-none">
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
                      <h2 title={title} className="text-sm sm:text-base font-bold tracking-tight text-text-primary truncate select-none">
                        {title}
                      </h2>
                      {meta && (
                        <div className="shrink-0 inline-flex items-center text-xs font-bold text-text-muted">
                          {meta}
                        </div>
                      )}
                    </div>
                    {sub && (
                      <p title={typeof sub === "string" ? sub : undefined} className="text-2xs font-medium text-text-muted truncate leading-snug mt-0.5 select-none">
                        {sub}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {actions && (
            <div
              className={cn(
                "flex items-center gap-1.5 shrink-0 ml-2",
                mode === "detail" && !isGlass && "[&_button]:bg-scrim/60 [&_button]:hover:bg-scrim/80 [&_button]:text-on-cover [&_button]:backdrop-blur-md [&_button]:border-border-glass [&_button]:shadow-sm"
              )}
            >
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* When desktop banner is hidden, preserve accessible H1 landmark */}
      {hideDesktop && <h1 className="sr-only text-text-primary">{title}</h1>}

      {/* Skipped for mode="detail" or hideDesktop — detail pages have their own hero, and unified destination pages match Beranda layout */}
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
                  <h1 title={title} className="text-2xl lg:text-3xl font-black tracking-tight text-text-primary truncate">
                    {title}
                  </h1>
                  {meta && (
                    <div className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface-base border border-border-default/60 text-xs font-bold text-text-muted">
                      {meta}
                    </div>
                  )}
                </div>
                {sub && (
                  <p title={typeof sub === "string" ? sub : undefined} className="text-text-muted mt-1 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
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

