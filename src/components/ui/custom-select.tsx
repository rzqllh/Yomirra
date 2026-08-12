"use client"

import * as React from "react"
import { CaretDown, Check } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  const selectedOption = options.find((opt) => opt.value === value) || options[0]
  
  const alignMap = {
    left: "start",
    center: "center",
    right: "end"
  } as const;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn("flex items-center justify-between gap-2 h-[44px] px-4 rounded-2xl bg-surface-glass backdrop-blur-md hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 border border-border-subtle shadow-xs text-[13px] font-bold text-text-primary transition-all", className, buttonClassName)}
        >
          <span className="truncate whitespace-nowrap">
            {selectedOption?.label}
          </span>
          <CaretDown
            size={14}
            weight="bold"
            className={cn("text-text-muted transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align={alignMap[align]} 
        className="w-48 rounded-2xl p-1.5"
      >
        <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer",
                  isSelected 
                    ? "bg-accent/10 text-accent focus:bg-accent/10 focus:text-accent" 
                    : "text-text-secondary focus:bg-surface-hover focus:text-text-primary"
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check size={14} weight="bold" className="shrink-0" />
                )}
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
