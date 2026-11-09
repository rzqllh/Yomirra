"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleNotch } from "@phosphor-icons/react"

import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-bold motion-safe:transition-[transform,background-color,color,border-color,box-shadow] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97] cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
        ghost:
          "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
        outline:
          "border border-border-strong bg-transparent hover:bg-surface-hover hover:text-text-primary",
        destructive:
          "bg-status-error-bg text-status-error-fg hover:bg-status-error-bg/75 border border-status-error-fg",
        reader:
          "bg-surface-overlay text-text-primary hover:bg-surface-raised border border-border-default",
        washi:
          "bg-surface-raised border border-border-default/80 text-text-primary hover:bg-surface-hover shadow-xs",
      },
      size: {
        sm: "min-h-11 px-3 text-xs rounded-sm [&_svg]:size-4",
        default: "min-h-11 px-4 py-2 rounded-sm [&_svg]:size-[18px]",
        lg: "min-h-12 px-6 text-base rounded-sm [&_svg]:size-5",
        icon: "h-11 w-11 rounded-sm shrink-0 p-0 [&_svg]:size-5",
        "icon-sm": "size-9 rounded-sm shrink-0 p-0 [&_svg]:size-4 relative after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:content-['']",
        "icon-lg": "h-12 w-12 rounded-sm shrink-0 p-0 [&_svg]:size-6",
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
            <CircleNotch className="motion-safe:animate-spin" size={18} weight="regular" />
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
