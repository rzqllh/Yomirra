"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

export interface YomirraPageHeaderProps {
  title: string
  showBack?: boolean
  backHref?: string
  action?: React.ReactNode
  className?: string
  /** 
   * "transparent" = completely blends with canvas.
   * "glass" = explicitly translucent panel (for when scrolling underneath).
   * "auto" = (default) transparent at top, becomes glass on scroll.
   */
  variant?: "transparent" | "glass" | "auto"
}

export function YomirraPageHeader({
  title,
  showBack = false,
  backHref,
  action,
  className,
  variant = "auto"
}: YomirraPageHeaderProps) {
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
    <header
      className={cn(
        "md:hidden sticky top-0 z-[var(--z-sticky)] flex h-[calc(var(--mobile-header-height)+var(--safe-top))] w-full items-center justify-between px-4 pt-[var(--safe-top)] transition-all duration-300 ease-out",
        isGlass 
          ? "bg-surface-base/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-surface-base/70 border-b border-border-glass shadow-sm"
          : "bg-transparent border-b border-transparent shadow-none",
        className
      )}
    >
      <div className="flex items-center gap-1 -ml-1">
        {showBack && (
          <button
            onClick={handleBack}
            className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-hover/50 active:bg-surface-hover"
            aria-label="Kembali"
          >
            <ArrowLeft size={24} weight="bold" className="text-text-primary transition-transform group-active:-translate-x-1" />
          </button>
        )}
        <h1 className={cn(
          "text-xl font-bold tracking-tight text-text-primary",
          showBack ? "ml-0" : "ml-1"
        )}>
          {title}
        </h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export interface DesktopPageTitleProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function DesktopPageTitle({ title, description, icon }: DesktopPageTitleProps) {
  return (
    <div className="hidden md:block relative overflow-hidden rounded-2xl bg-surface-muted/30 border border-border-subtle p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
      <div className="relative flex items-start gap-4">
        {icon && (
          <div className="shrink-0 p-3 bg-surface-base rounded-xl shadow-sm border border-border-default/50 text-accent">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">
            {title}
          </h1>
          {description && (
            <p className="text-text-muted mt-2 text-sm md:text-base max-w-2xl font-medium">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
