import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ className, checked, onCheckedChange, label, id, ...props }, ref) => {
    const defaultId = React.useId()
    const elementId = id || defaultId

    return (
      <label htmlFor={elementId} className={cn("relative inline-flex min-h-11 items-center gap-3 cursor-pointer text-sm font-semibold text-text-primary", className)}>
        {label && <span className="sr-only">{label}</span>}
        <input
          type="checkbox"
          id={elementId}
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          ref={ref}
          {...props}
        />
        <span aria-hidden="true" className="relative block h-8 w-14 shrink-0 rounded-full border border-border-strong bg-surface-muted motion-safe:transition-[background-color,border-color] motion-safe:duration-300 peer-checked:border-accent peer-checked:bg-accent-dim peer-checked:[&>span]:translate-x-6 peer-checked:[&>span]:bg-accent peer-checked:[&>span]:text-accent-on peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
          <span className="absolute left-[3px] top-[3px] grid size-6 place-items-center rounded-full bg-surface-overlay text-text-secondary shadow-sm motion-safe:transition-[transform,background-color,color] motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(.18,1.35,.32,1)]" />
        </span>
      </label>
    )
  }
)

ToggleSwitch.displayName = "ToggleSwitch"
