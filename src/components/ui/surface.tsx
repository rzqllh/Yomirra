import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const surfaceVariants = cva(
  "transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface-base text-text-primary",
        base: "bg-surface-base text-text-primary",
        raised: "bg-surface-raised border border-border-default text-text-primary",
        overlay: "bg-surface-overlay border border-border-subtle text-text-primary",
        muted: "bg-surface-muted border border-border-subtle text-text-secondary",
        glass: "yomirra-glass-foundation text-text-primary",
        glassHeader: "bg-surface-base/85 backdrop-blur-[var(--glass-blur-header)] border-b border-border-subtle text-text-primary",
        glassChrome: "yomirra-glass-foundation bg-surface-glass/90 border border-border-glass text-text-primary",
        glassPopover: "bg-surface-overlay/95 backdrop-blur-[var(--glass-blur-popover)] border border-border-subtle shadow-lg text-text-primary",
        glassStatus: "bg-surface-overlay/95 backdrop-blur-[var(--glass-blur-statusbar)] border border-border-subtle text-text-primary",
        glassToast: "backdrop-blur-[var(--glass-blur-liquid)] backdrop-saturate-[var(--glass-saturate-toast)] bg-surface-overlay/95 border border-border-subtle text-text-primary",
        glassBanner: "backdrop-blur-[var(--glass-blur-chrome)] bg-accent-dim border border-accent/20 text-text-primary",
        editorial: "bg-surface-base border border-border-subtle overflow-hidden",
      },
      elevation: {
        none: "",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        popover: "shadow-xl",
        modal: "shadow-2xl",
      },
      rounded: {
        none: "rounded-none",
        control: "rounded-role-control",
        card: "rounded-role-card",
        modal: "rounded-role-modal",
        nav: "rounded-role-nav",
        dock: "rounded-role-dock",
        chip: "rounded-role-chip",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      elevation: "none",
    },
  }
)

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  asChild?: boolean
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, elevation, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn(surfaceVariants({ variant, elevation, rounded }), className)}
        {...props}
      />
    )
  }
)

Surface.displayName = "Surface"
export { surfaceVariants }
