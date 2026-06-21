"use client"

import * as React from "react"
import { CaretDown, Check } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

interface SelectOption {
  value: string
  label: React.ReactNode
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  buttonClassName?: string
  align?: "left" | "right" | "center"
}

export function CustomSelect({ value, onChange, options, className, buttonClassName, align = "right" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn("flex items-center gap-2 h-[34px] px-3.5 rounded-full bg-surface-glass backdrop-blur-md --glass hover:bg-surface-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 -[0_4px_16px_rgba(0,0,0,0.05)] dark:-[0_4px_16px_rgba(0,0,0,0.2)] transition-all", buttonClassName)}
      >
        <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap">
          {selectedOption?.label}
        </span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn("text-text-muted transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div 
          className={cn( "absolute z-50 mt-2 w-48 rounded-2xl bg-surface-overlay/80 backdrop-blur-lg --glass/20 -2xl p-1.5 animate-in fade-in zoom-in-95 duration-200", align === "right" ? "right-0" : align === "left" ? "left-0" : "left-1/2 -translate-x-1/2" )}
        >
          <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-[13px] font-medium rounded-lg transition-colors text-left",
                    isSelected 
                      ? "bg-accent/10 text-accent" 
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check size={14} weight="bold" className="shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
