"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleNotch } from "@phosphor-icons/react"

import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-xs border border-transparent font-bold",
        default:
          "bg-text-primary text-background hover:bg-text-primary/90",
        accent:
          "bg-accent/10 text-accent hover:bg-accent/20 shadow-none dark:bg-accent/20 dark:hover:bg-accent/30 border border-accent/20",
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
          "bg-semantic-error text-white hover:bg-semantic-error/90 active:scale-[0.98] shadow-xs border border-transparent font-bold",
        success:
          "bg-semantic-success text-white hover:bg-semantic-success/90 active:scale-[0.98] shadow-xs border border-transparent font-bold",
        warning:
          "bg-semantic-warning text-black hover:bg-semantic-warning/90 active:scale-[0.98] shadow-xs border border-transparent font-bold",
        info:
          "bg-semantic-info text-white hover:bg-semantic-info/90 active:scale-[0.98] shadow-xs border border-transparent font-bold",
        muted:
          "bg-surface-muted text-text-muted hover:bg-surface-hover hover:text-text-primary border border-border-subtle active:scale-[0.98]",
        reader:
          "bg-surface-overlay text-text-primary hover:bg-surface-raised border border-border-default",
        link:
          "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-[10px] [&_svg]:size-3.5",
        default: "h-10 px-4 py-2 rounded-[12px] [&_svg]:size-4",
        lg: "h-12 px-6 text-base rounded-[16px] [&_svg]:size-5",
        icon: "h-10 w-10 rounded-[12px] shrink-0 p-0 [&_svg]:size-5",
        "icon-sm": "h-8 w-8 rounded-[10px] shrink-0 p-0 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 rounded-[14px] shrink-0 p-0 [&_svg]:size-5",
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
