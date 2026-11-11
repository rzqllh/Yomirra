"use client"

import * as React from "react"
import { CustomSelect } from "@/components/ui/custom-select"
import { cn } from "@/shared/utils/cn"

export interface SelectOption {
  value: string
  label: React.ReactNode
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  buttonClassName?: string
  align?: "left" | "right" | "center"
  label?: string
  disabled?: boolean
  variant?: "default" | "compact" | "overlay"
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      value,
      onChange,
      options,
      className,
      buttonClassName,
      align = "right",
      label = "Pilih opsi",
      disabled = false,
      variant = "default",
    },
    ref
  ) => {
    return (
      <div className={cn("relative inline-block w-full", className)}>
        <select
          ref={ref}
          aria-hidden="true"
          disabled={disabled}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          className="sr-only pointer-events-none absolute"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {typeof opt.label === "string" ? opt.label : opt.value}
            </option>
          ))}
        </select>
        <CustomSelect
          value={value}
          onChange={onChange}
          options={options}
          align={align}
          label={label}
          disabled={disabled}
          buttonClassName={cn(
            variant === "compact" && "min-h-10 px-3 text-xs",
            variant === "overlay" && "bg-surface-overlay border-border-default",
            buttonClassName
          )}
        />
      </div>
    )
  }
)

Select.displayName = "Select"
export { CustomSelect }
