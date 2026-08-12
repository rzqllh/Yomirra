"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react"
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
  variant = "auto",
  className,
}: PageHeaderProps) {
  const router = useRouter()
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    if (variant !== "auto") return

    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [variant])

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  const isGlass = variant === "glass" || (variant === "auto" && scrolled)

  return (
    <>
      {/* ── Mobile Navigation Bar (md:hidden) ── */}
      <header
        className={cn(
          "md:hidden fixed top-0 left-0 right-0 z-[var(--z-sticky)] flex w-full items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] pb-2 transition-all duration-300 ease-out pointer-events-none",
          isGlass
            ? "bg-surface-glass backdrop-blur-md border-b border-border-default shadow-sm"
            : "bg-transparent border-transparent shadow-none",
          className
        )}
      >
        <div className="flex items-center justify-between w-full transition-all duration-300 ease-out pointer-events-auto min-h-[56px]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {showBack ? (
              <button
                onClick={handleBack}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full transition-colors text-text-primary hover:bg-black/5 dark:hover:bg-surface-hover active:bg-black/10 dark:active:bg-surface-hover/80 shrink-0"
                aria-label="Kembali"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            ) : (
              icon && (
                <div className="text-accent bg-accent/10 p-1.5 rounded-lg border border-accent/20 shrink-0">
                  {icon}
                </div>
              )
            )}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <p className="text-xl font-extrabold tracking-tight text-text-primary truncate">
                {title}
              </p>
              {meta && <div className="shrink-0 text-sm font-semibold text-text-muted">{meta}</div>}
            </div>
          </div>

          {actions && <div className="shrink-0 ml-2">{actions}</div>}
        </div>
      </header>

      {/* ── Desktop Hero Section Header (hidden md:block) ── */}
      <div className={cn("hidden md:block relative overflow-hidden rounded-2xl bg-surface-muted/30 border border-border-subtle p-6 md:p-8 mb-6 md:mb-8", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {icon && (
              <div className="shrink-0 p-3 bg-surface-base rounded-xl shadow-sm border border-border-default/50 text-accent">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary truncate">
                  {title}
                </h1>
                {meta && <div className="shrink-0">{meta}</div>}
              </div>
              {description && (
                <div className="text-text-muted mt-2 text-sm md:text-base max-w-2xl font-medium">
                  {description}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    </>
  )
}


