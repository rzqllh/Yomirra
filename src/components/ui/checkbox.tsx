import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { Check } from "@phosphor-icons/react"

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative flex items-center justify-center w-6 h-6">
      <input
        type="checkbox"
        ref={ref}
        className="peer sr-only"
        {...props}
      />
      <div className={cn(
        "flex size-5 items-center justify-center rounded-sm border border-border-strong bg-transparent shadow-sm",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-base",
        "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "transition-colors",
        className
      )}>
        <Check size={14} weight="bold" className="opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    </div>
  )
})
Checkbox.displayName = "Checkbox"
