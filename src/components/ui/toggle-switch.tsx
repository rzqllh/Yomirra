"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/shared/utils/cn"
import { transitions } from "@/shared/lib/motion/tokens"

interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ className, checked, onCheckedChange, label, id, ...props }, ref) => {
    const defaultId = React.useId()
    const elementId = id || defaultId
    const reducedMotion = useReducedMotion()

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
        <span aria-hidden="true" className="relative block h-8 w-14 shrink-0 rounded-full border border-border-strong bg-surface-muted motion-safe:transition-[background-color,border-color] motion-safe:duration-200 peer-checked:border-accent peer-checked:bg-accent-dim peer-checked:[&>span]:bg-accent peer-checked:[&>span]:text-accent-on peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
          <motion.span
            initial={false}
            animate={{ x: checked ? 24 : 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.snappy}
            className="absolute left-[3px] top-[3px] grid size-6 place-items-center rounded-full bg-surface-overlay text-text-secondary shadow-sm motion-safe:transition-[background-color,color] motion-safe:duration-200"
          />
        </span>
      </label>
    )
  }
)

ToggleSwitch.displayName = "ToggleSwitch"
