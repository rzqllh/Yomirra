import * as React from "react"
import { cn } from "@/shared/utils/cn"

// --- Yomirra Surface ---
export type SurfaceVariant = "base" | "raised" | "elevated" | "floating" | "glass" | "muted"

export interface YomirraSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
  asChild?: boolean
}

export const YomirraSurface = React.forwardRef<HTMLDivElement, YomirraSurfaceProps>(
  ({ className, variant = "base", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn( "transition-colors", { "bg-surface-base text-text-primary": variant === "base", "bg-surface-raised text-text-primary": variant === "raised", "bg-surface-overlay text-text-primary -sm --subtle": variant === "elevated", "bg-surface-overlay text-text-primary -glass --default": variant === "floating", "bg-surface-base/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-base/60 --glass -sm": variant === "glass", "bg-surface-muted text-text-primary": variant === "muted",},
          className
        )}
        {...props}
      />
    )
  }
)
YomirraSurface.displayName = "YomirraSurface"

// --- Yomirra Section ---
export interface YomirraSectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  action?: React.ReactNode
  titleClassName?: string
}

export const YomirraSection = React.forwardRef<HTMLElement, YomirraSectionProps>(
  ({ className, title, action, children, titleClassName, ...props }, ref) => {
    return (
      <section ref={ref} className={cn("flex flex-col gap-4", className)} {...props}>
        {(title || action) && (
          <div className="flex items-end justify-between gap-4 px-4 md:px-0">
            {title && (
              <h2 className={cn("text-xl md:text-2xl font-bold tracking-tight text-text-primary", titleClassName)}>
                {title}
              </h2>
            )}
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className="flex flex-col gap-4">{children}</div>
      </section>
    )
  }
)
YomirraSection.displayName = "YomirraSection"
