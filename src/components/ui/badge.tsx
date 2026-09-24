import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const badgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1 rounded-[8px] border px-2 py-0.5 text-xs font-bold leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        default: "border-border-default bg-surface-base text-text-secondary",
        source: "border-accent/20 bg-accent/10 text-accent",
        status: "border-border-default bg-surface-raised text-text-secondary",
        success: "border-transparent bg-status-success-bg text-status-success-fg",
        warning: "border-transparent bg-status-warning-bg text-status-warning-fg",
        error: "border-transparent bg-status-error-bg text-status-error-fg",
        muted: "border-border-default bg-surface-raised text-text-muted",
        outline: "border-border-strong bg-transparent text-text-secondary",
        accent: "border-accent/30 bg-accent/10 text-accent",
        reader: "border-border-default bg-surface-overlay text-text-primary",
        // Legacy aliases
        online: "border-transparent bg-status-success-bg text-status-success-fg",
        slow: "border-transparent bg-status-warning-bg text-status-warning-fg",
        unavailable: "border-transparent bg-status-error-bg text-status-error-fg",
        cached: "border-border-default bg-surface-overlay text-text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
