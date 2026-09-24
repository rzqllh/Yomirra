"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleNotch } from "@phosphor-icons/react"

import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-bold motion-safe:transition-[transform,background-color,color,border-color,box-shadow] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97] cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-on hover:bg-accent-hover border border-transparent",
        default:
          "bg-text-primary text-background hover:bg-text-primary/90",
        accent:
          "bg-accent-dim text-accent hover:bg-accent/20 shadow-none border border-accent/20",
        secondary:
          "bg-surface-raised text-text-primary border border-border-default hover:bg-surface-hover",
        tertiary:
          "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
        ghost:
          "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
        outline:
          "border border-border-strong bg-transparent hover:bg-surface-hover hover:text-text-primary",
        glass:
          "bg-surface-glass backdrop-blur-md border border-border-default/40 text-text-primary hover:bg-surface-hover hover:border-border-strong active:scale-95 shadow-xs",
        destructive:
          "bg-status-error-bg text-status-error-fg hover:bg-status-error-bg/75 border border-status-error-fg",
        success:
          "bg-status-success-bg text-status-success-fg hover:bg-status-success-bg/75 border border-status-success-fg",
        warning:
          "bg-status-warning-bg text-status-warning-fg hover:bg-status-warning-bg/75 border border-status-warning-fg",
        info:
          "bg-status-info-bg text-status-info-fg hover:bg-status-info-bg/75 border border-status-info-fg",
        muted:
          "bg-surface-muted text-text-muted hover:bg-surface-hover hover:text-text-primary border border-border-subtle active:scale-[0.98]",
        reader:
          "bg-surface-overlay text-text-primary hover:bg-surface-raised border border-border-default",
        link:
          "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-11 px-3 text-xs rounded-[12px] [&_svg]:size-4",
        default: "min-h-11 px-4 py-2 rounded-[12px] [&_svg]:size-[18px]",
        lg: "min-h-12 px-6 text-base rounded-[12px] [&_svg]:size-5",
        icon: "h-11 w-11 rounded-[12px] shrink-0 p-0 [&_svg]:size-5",
        "icon-sm": "h-11 w-11 rounded-[12px] shrink-0 p-0 [&_svg]:size-5",
        "icon-lg": "h-12 w-12 rounded-[12px] shrink-0 p-0 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  active?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, active = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          active && "bg-accent-dim text-accent border-accent/30",
          loading && "cursor-wait pointer-events-none"
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <CircleNotch className="motion-safe:animate-spin" size={18} weight="bold" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
