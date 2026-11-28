"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Books, CalendarBlank, CaretLeft, Compass, Download, Fire, Gear, HardDrives, MagnifyingGlass, Question, UserCircle } from "@phosphor-icons/react"
import { motion, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react"
import { Button } from "@/components/ui/button"
import { navigationLabels } from "./navigation-labels"
import { useSearchAnchorPastHeader } from "./use-search-anchor-past-header"
import { IconButton } from "@/components/ui/icon-button"
import { HeaderActions } from "./header-actions"
import { cn } from "@/shared/utils/cn"
import { transitions } from "@/shared/lib/motion/tokens"
import { hasNavigationParent } from "@/shared/lib/navigation-intent"

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
  /** Fallback destination when browser history is unavailable. */
  backHref?: string
  /** Navigate directly to backHref when the page provides a parent control. */
  backBehavior?: "history" | "parent"
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
  /** Compact desktop controls and semantic heading for destination layouts. */
  desktopPresentation?: "banner" | "compact"
  /** Use content when the page already supplies its primary heading. */
  headingOwner?: "header" | "content"
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
  backBehavior = "history",
  actions = <HeaderActions />,
  desktopActions,
  meta,
  mode = "standard",
  variant = "auto",
  detailTitleAnchorId,
  heroSearchAnchorId,
  hideDesktop = false,
  desktopPresentation = "banner",
  headingOwner = "header",
  className,
}: PageHeaderProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [detailTitleVisible, setDetailTitleVisible] = React.useState(false)
  const heroSearchPast = useSearchAnchorPastHeader(heroSearchAnchorId, 56)
  const sub = subtitle ?? description

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (value) => setIsScrolled(value > 12))

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
    if (backBehavior === "history" && typeof window !== "undefined" && window.history.length > 1 && (!backHref || hasNavigationParent(backHref))) {
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
  const compact = desktopPresentation === "compact"
  const DesktopTitle = headingOwner === "header" ? "h1" : "p"
  const MobileTitle = compact || hideDesktop || headingOwner === "content" ? "p" : "h2"
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
          "md:hidden fixed left-0 right-0 z-[var(--z-sticky)] flex w-full flex-col justify-end px-4 pt-[calc(var(--safe-top,0px)+8px)] pb-2 transition-[background-color,border-color,top] duration-200 ease-out motion-reduce:transition-none pointer-events-none",
          isGlass && "yomirra-chrome border-x-0 border-t-0 rounded-none",
          isTransparent && "bg-transparent border-transparent shadow-none backdrop-blur-none",
          className
        )}
      >
        <div className="flex items-center justify-between w-full pointer-events-auto h-11">
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
                      : transitions.layout
                  }
                  className="flex-1 min-w-0 pr-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("open-command-menu"))
                    }}
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
                      : transitions.page
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
                      "flex flex-col min-w-0 flex-1 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                      !isTitleVisible
                        ? "opacity-0 pointer-events-none -translate-y-1"
                        : "opacity-100 translate-y-0"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MobileTitle title={title} className="text-sm sm:text-base font-bold tracking-tight text-text-primary truncate select-none">
                        {title}
                      </MobileTitle>
                      {meta && (
                        <div className="shrink-0 inline-flex items-center text-xs font-bold text-text-muted">
                          {meta}
                        </div>
                      )}
                    </div>
                    {sub && (
                      <p title={typeof sub === "string" ? sub : undefined} className="text-xs font-medium text-text-secondary truncate leading-snug mt-0.5 select-none">
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

      {headingOwner === "header" && (hideDesktop || compact) && (
        <h1 className="sr-only text-text-primary">{title}</h1>
      )}

      {(compact || hideDesktop || mode === "detail") && ((compact && showBack) || desktopActions != null) && (
        <div className="hidden w-full items-center gap-3 md:flex">
          {compact && showBack && (
            <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
              <CaretLeft aria-hidden="true" />
              Kembali
            </Button>
          )}
          {desktopActions != null && <div className="ml-auto">{desktopActions}</div>}
        </div>
      )}

      {mode !== "detail" && !hideDesktop && !compact && (
        <div
          className={cn(
            "hidden md:block relative border-b border-border-subtle px-0 pt-1 pb-4 mb-5",
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
                  <DesktopTitle title={title} className="text-2xl lg:text-3xl font-bold tracking-tight text-text-primary truncate">
                    {title}
                  </DesktopTitle>
                  {meta && (
                    <div className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface-base border border-border-default/60 text-xs font-bold text-text-muted">
                      {meta}
                    </div>
                  )}
                </div>
                {sub && (
                  <p title={typeof sub === "string" ? sub : undefined} className="text-text-secondary mt-1 text-sm max-w-2xl leading-relaxed">
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


/** Single source of truth for destination headers, including loading states.
 * Home and manga detail retain their specialized PageHeader contracts.
 */
const destinationHeaders = {
  search: { title: navigationLabels.search, subtitle: "Cari komik dari sumber yang dipilih.", Icon: MagnifyingGlass },
  library: { title: navigationLabels.library, subtitle: "Jelajahi katalog dari sumber yang kamu pilih.", Icon: Compass },
  bookmark: { title: navigationLabels.bookmark, subtitle: "Bacaan dan komik yang kamu simpan.", Icon: Books },
  popular: { title: navigationLabels.popular, subtitle: "Peringkat komik teratas dari sumber aktif dan tren global.", Icon: Fire },
  sources: { title: navigationLabels.sources, subtitle: "Atur sumber yang digunakan saat menjelajah.", Icon: HardDrives },
  settings: { title: navigationLabels.settings, subtitle: "Atur akun, tampilan, bacaan, dan penyimpanan Yomirra.", Icon: Gear },
  downloads: { title: navigationLabels.downloads, subtitle: "Kelola chapter yang tersimpan untuk dibaca offline.", Icon: Download },
  account: { title: navigationLabels.account, subtitle: "Kelola akun dan sinkronisasi bacaanmu.", Icon: UserCircle, showBack: true, backHref: "/settings" },
  updates: { title: navigationLabels.updates, subtitle: "Lihat perkiraan jadwal chapter baru dari komik yang kamu simpan.", Icon: CalendarBlank, showBack: true, backHref: "/bookmark" },
  help: { title: navigationLabels.help, subtitle: "Panduan singkat saat mencari, membaca, dan menyimpan komik.", Icon: Question, showBack: true, backHref: "/" },
} satisfies Record<string, {
  title: string
  subtitle: string
  Icon: typeof MagnifyingGlass
  showBack?: boolean
  backHref?: string
}>

type Destination = keyof typeof destinationHeaders

export function DestinationHeader({
  destination,
  ...props
}: Omit<PageHeaderProps, "title" | "subtitle" | "description" | "icon" | "hideDesktop"> & {
  destination: Destination
}) {
  const { Icon, ...preset } = destinationHeaders[destination]
  return <PageHeader desktopPresentation="compact" {...preset} {...props} icon={<Icon size={24} weight="regular" />} />
}
