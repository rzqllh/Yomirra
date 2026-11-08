import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1 border font-bold leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-accent",
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
      size: {
        sm: "min-h-5 px-1.5 py-0.5 text-[10px]",
        default: "min-h-6 px-2 py-0.5 text-xs",
      },
      shape: {
        rounded: "rounded-xs",
        pill: "rounded-role-chip",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "rounded",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, shape, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, shape }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
