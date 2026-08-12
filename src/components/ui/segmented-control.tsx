"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { motion } from "motion/react";

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: "glass-floating" | "soft-inset";
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
  layoutId?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  variant = "glass-floating",
  size = "md",
  className,
  fullWidth = false,
  layoutId = "segmented-pill",
}: SegmentedControlProps) {
  const isGlass = variant === "glass-floating";

  return (
    <div
      className={cn(
        "relative flex items-center p-1 transition-all duration-300 select-none",
        isGlass
          ? "rounded-2xl bg-surface-glass backdrop-blur-md border border-border-subtle shadow-xs"
          : "rounded-2xl bg-surface-muted/90 border border-border-subtle/40 shadow-inner",
        fullWidth ? "w-full" : "inline-flex",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 transition-colors duration-200 outline-none whitespace-nowrap font-bold",
              isGlass ? "rounded-xl" : "rounded-xl",
              size === "sm" && "py-1.5 px-3 text-xs",
              size === "md" && "py-2 px-4 text-xs sm:text-sm",
              size === "lg" && "py-2.5 px-5 text-sm sm:text-base",
              fullWidth ? "flex-1" : "flex-1 sm:flex-none sm:min-w-[100px]",
              isActive
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            )}
            role="tab"
            id={`tab-${option.value}`}
            aria-controls={`tabpanel-${option.value}`}
            aria-selected={isActive}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  "absolute inset-0 z-0 transition-shadow",
                  isGlass
                    ? "rounded-xl bg-surface-raised shadow-xs border border-border-subtle/80"
                    : "rounded-xl bg-surface-base shadow-xs border border-border-subtle/60"
                )}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: isGlass ? 500 : 450,
                  damping: isGlass ? 38 : 35,
                }}
              />
            )}
            {option.icon && (
              <span className="relative z-10 shrink-0">{option.icon}</span>
            )}
            <span className="relative z-10">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
