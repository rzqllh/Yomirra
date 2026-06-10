import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-focus-ring",
  {
    variants: {
      variant: {
        default: "border-border-subtle bg-surface-overlay text-text-secondary",
        source: "border-accent/20 bg-accent/10 text-accent",
        status: "border-border-subtle bg-surface-raised text-text-secondary",
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/20 bg-warning/10 text-warning",
        error: "border-error/20 bg-error/10 text-error",
        muted: "border-border-subtle bg-surface-raised text-text-muted",
        outline: "border-border-strong bg-transparent text-text-secondary",
        accent: "border-accent/30 bg-accent/10 text-accent",
        reader: "border-border-subtle bg-surface-overlay text-text-primary",
        // Legacy aliases
        online: "border-success/20 bg-success/10 text-success",
        slow: "border-warning/20 bg-warning/10 text-warning",
        unavailable: "border-error/20 bg-error/10 text-error",
        cached: "border-border-subtle bg-surface-overlay text-text-muted",
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
