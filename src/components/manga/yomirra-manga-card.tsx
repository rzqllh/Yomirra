import * as React from "react"
import { cn } from "@/shared/utils/cn"
import Image from "next/image"

export type MangaCardVariant = "editorial" | "continue" | "shelf" | "history" | "compact"

export interface YomirraMangaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: MangaCardVariant
  title: string
  coverUrl: string
  subtitle?: string
  action?: React.ReactNode
  priority?: boolean
  progress?: number // For 'continue' or 'history'
}

export const YomirraMangaCard = React.forwardRef<HTMLDivElement, YomirraMangaCardProps>(
  ({ className, variant = "shelf", title, coverUrl, subtitle, action, priority, progress, ...props }, ref) => {
    
    // Phase B Groundwork: Laying out the variants
    // Actual implementation for each variant will be built in Phase C/D

    if (variant === "editorial") {
      return (
        <div ref={ref} className={cn("relative flex flex-col w-full group rounded-[12px] overflow-hidden bg-surface-muted border border-border-default shadow-sm aspect-[3/4]", className)} {...props}>
          {/* Editorial implementation */}
        </div>
      )
    }

    if (variant === "continue") {
      return (
        <div ref={ref} className={cn("relative flex items-center w-full gap-4 p-4 rounded-[16px] bg-surface-overlay shadow-sm border border-border-subtle", className)} {...props}>
           {/* Continue reading implementation */}
        </div>
      )
    }

    if (variant === "history") {
       return (
        <div ref={ref} className={cn("flex items-center gap-4 rounded-xl bg-surface-raised p-3 border border-border-subtle/50 transition-all hover:bg-surface-overlay overflow-hidden", className)} {...props}>
           {/* History item implementation */}
        </div>
      )
    }

    if (variant === "compact") {
      return (
        <div ref={ref} className={cn("flex items-center gap-3 w-full", className)} {...props}>
          {/* Compact list item implementation */}
        </div>
      )
    }

    // Default: 'shelf'
    return (
      <div ref={ref} className={cn("flex flex-col group w-full", className)} {...props}>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[10px] bg-surface-muted border border-border-subtle shadow-sm mb-2.5">
          {/* Shelf cover implementation */}
        </div>
        <div className="flex flex-col px-1">
          <h3 className="text-[13px] font-bold leading-tight text-text-primary line-clamp-2 mb-0.5">{title}</h3>
          {subtitle && <p className="text-[11px] font-medium text-text-muted truncate">{subtitle}</p>}
        </div>
      </div>
    )
  }
)

YomirraMangaCard.displayName = "YomirraMangaCard"
