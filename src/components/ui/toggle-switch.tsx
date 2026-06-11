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
      <label htmlFor={elementId} className={cn("relative inline-flex items-center cursor-pointer", className)}>
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
        <div className="w-11 h-6 bg-surface-raised border border-border-default rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:border after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-checked:border-accent"></div>
      </label>
    )
  }
)

ToggleSwitch.displayName = "ToggleSwitch"
