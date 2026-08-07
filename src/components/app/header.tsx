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
  icon?: React.ReactNode
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
  icon,
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
      className={cn( "md:hidden sticky top-0 z-[var(--z-sticky)] flex w-full items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] pb-2 transition-all duration-300 ease-out pointer-events-none", isGlass ? "bg-surface-glass backdrop-blur-md border-b border-border-default shadow-sm" : "bg-transparent border-transparent shadow-none", className )}
    >
      <div className="flex items-center justify-between w-full transition-all duration-300 ease-out pointer-events-auto h-[56px]">
        
        {/* Left Side: Back button OR Large Title + Icon */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <>
              <button
                onClick={handleBack}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full transition-colors text-text-primary hover:bg-black/5 dark:hover:bg-surface-hover active:bg-black/10 dark:active:bg-surface-hover/80"
                aria-label="Kembali"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-text-primary truncate ml-0">
                {title}
              </h1>
            </>
          ) : (
            <div className="flex items-center gap-2.5 ml-1">
              {icon && (
                <div className="text-accent bg-accent/10 p-1.5 rounded-lg border border-accent/20">
                  {icon}
                </div>
              )}
              <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary truncate">
                {title}
              </h1>
            </div>
          )}
        </div>

        {/* Right Side: Action Button */}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}

export interface DesktopPageTitleProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function DesktopPageTitle({ title, description, icon, action }: DesktopPageTitleProps) {
  return (
    <div className="hidden md:block relative overflow-hidden rounded-2xl bg-surface-muted/30 border border-border-subtle p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
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
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
