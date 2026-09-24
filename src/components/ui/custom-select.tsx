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
  label?: string
}

export function CustomSelect({ value, onChange, options, className, buttonClassName, align = "right", label = "Pilih opsi" }: CustomSelectProps) {
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
          aria-label={`${label}: ${typeof selectedOption?.label === "string" ? selectedOption.label : value}`}
          className={cn("flex min-h-[48px] items-center justify-between gap-3 rounded-[12px] border border-border-strong bg-surface-overlay px-4 text-sm font-semibold text-text-primary motion-safe:transition-[background-color,border-color,box-shadow] motion-safe:duration-300 hover:border-accent hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[state=open]:border-accent data-[state=open]:ring-[3px] data-[state=open]:ring-accent-dim", className, buttonClassName)}
        >
          <span className="truncate whitespace-nowrap">
            {selectedOption?.label}
          </span>
          <CaretDown
            size={14}
            weight="bold"
            className={cn("shrink-0 rounded-[8px] bg-accent-dim box-content p-2 text-accent motion-safe:transition-transform motion-safe:duration-300", isOpen && "rotate-180")}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align={alignMap[align]} 
        className="min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-[12px] p-1.5"
      >
        <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
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
