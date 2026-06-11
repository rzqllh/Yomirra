import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-focus-ring",
  {
    variants: {
      variant: {
        default: "border-border-default bg-surface-base text-text-secondary",
        source: "border-accent/20 bg-accent/10 text-accent",
        status: "border-border-default bg-surface-raised text-text-secondary",
        success: "border-semantic-success/20 bg-semantic-success/10 text-semantic-success",
        warning: "border-semantic-warning/20 bg-semantic-warning/10 text-semantic-warning",
        error: "border-semantic-error/20 bg-semantic-error/10 text-semantic-error",
        muted: "border-border-default bg-surface-raised text-text-muted",
        outline: "border-border-strong bg-transparent text-text-secondary",
        accent: "border-accent/30 bg-accent/10 text-accent",
        reader: "border-border-default bg-surface-overlay text-text-primary",
        // Legacy aliases
        online: "border-semantic-success/20 bg-semantic-success/10 text-semantic-success",
        slow: "border-semantic-warning/20 bg-semantic-warning/10 text-semantic-warning",
        unavailable: "border-semantic-error/20 bg-semantic-error/10 text-semantic-error",
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
