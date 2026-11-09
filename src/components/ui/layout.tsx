import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { Surface, type SurfaceProps } from "./surface"

/** @deprecated Use `Surface` from `@/components/ui/surface` directly */
export const YomirraSurface = Surface
export type YomirraSurfaceProps = SurfaceProps

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

export * from "./page-container"
export * from "./page-toolbar"
export * from "./section-heading"

