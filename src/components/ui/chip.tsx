import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-bold transition-all border shrink-0 motion-safe:active:scale-[0.98] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary",
        accent:
          "bg-accent-dim border-accent/30 text-accent hover:bg-accent/20",
        inverted:
          "bg-text-primary text-surface-base border-transparent shadow-xs",
        solid:
          "bg-accent text-accent-on border-transparent shadow-xs",
        error:
          "bg-status-error-bg text-status-error-fg border-status-error-fg",
        offline:
          "bg-semantic-error/10 border-semantic-error/20 text-semantic-error hover:bg-semantic-error/20",
      },
      size: {
        sm: "min-h-9 px-2.5 text-[11px]",
        default: "min-h-11 px-3.5 text-xs",
        lg: "min-h-12 px-4 text-sm",
      },
      shape: {
        pill: "rounded-role-chip",
        rounded: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "rounded",
    },
  }
)

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  asChild?: boolean
  selected?: boolean
  showCheck?: boolean
  showMinus?: boolean
  onRemove?: () => void
  removeAriaLabel?: string
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      asChild = false,
      selected,
      showCheck,
      showMinus,
      onRemove,
      removeAriaLabel = "Hapus filter",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const isSelected = selected ?? (variant === "solid" || variant === "accent")

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : "button"}
        disabled={disabled}
        aria-pressed={selected !== undefined ? selected : undefined}
        className={cn(
          chipVariants({ variant, size, shape }),
          selected && variant === "default" && "bg-accent-dim border-accent/40 text-accent",
          className
        )}
        {...props}
      >
        {showCheck && <Check size={14} weight="regular" className="shrink-0" />}
        {showMinus && <span className="mr-0.5 font-black shrink-0">-</span>}
        <span>{children}</span>
        {onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label={removeAriaLabel}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation()
                e.preventDefault()
                onRemove()
              }
            }}
            className="ml-1 inline-flex size-4 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-colors"
          >
            <X size={12} weight="bold" />
          </span>
        )}
      </Comp>
    )
  }
)

Chip.displayName = "Chip"
export { chipVariants }
