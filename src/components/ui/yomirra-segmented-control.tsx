"use client"

import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface YomirraSegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
  layoutId?: string;
}

export function YomirraSegmentedControl({
  options,
  value,
  onChange,
  className,
  fullWidth = false,
  layoutId = "segmented-pill"
}: YomirraSegmentedControlProps) {

  return (
    <div 
      className={cn(
        "relative flex items-center rounded-full bg-surface-muted/60 p-1 border border-border-subtle backdrop-blur-md",
        fullWidth ? "w-full" : "inline-flex",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
              <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex items-center justify-center rounded-full py-[6px] px-4 text-[13px] font-semibold transition-colors duration-300 outline-none select-none tracking-wide whitespace-nowrap",
              fullWidth ? "flex-1" : "min-w-[100px]",
              isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 z-0 rounded-full bg-surface-overlay dark:bg-[#1E1E2E] shadow-sm border border-border-default/50"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
