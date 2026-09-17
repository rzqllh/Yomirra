"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { motion } from "motion/react";

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "accent" | "muted" | "error";
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: "quick-rail" | "glass-floating" | "soft-inset";
  shape?: "rounded" | "pill";
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
  layoutId?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  variant = "quick-rail",
  shape = "rounded",
  size = "md",
  className,
  fullWidth = false,
  layoutId = "segmented-pill",
}: SegmentedControlProps) {
  const isPill = shape === "pill";
  const isQuickRail = variant === "quick-rail";
  const isGlass = variant === "glass-floating";

  // Concentric radius formula:
  // - Pill: Both outer container and inner indicator are rounded-full.
  // - Rounded: Outer rounded-2xl with p-1 padding requires inner rounded-md (14px squircle)
  //   satisfying R_inner = R_outer - padding to prevent corner pinching/bulging.
  const containerRadiusClass = isPill ? "rounded-full" : "rounded-2xl";
  const itemRadiusClass = isPill ? "rounded-full" : "rounded-md";

  return (
    <div
      role="tablist"
      className={cn(
        "relative flex items-center p-1 transition-all duration-200 select-none",
        containerRadiusClass,
        isQuickRail && "bg-surface-raised/90 border border-border-subtle shadow-xs",
        isGlass && "bg-surface-glass backdrop-blur-md border border-border-subtle shadow-xs",
        variant === "soft-inset" && "bg-surface-muted/90 border border-border-subtle/40 shadow-inner",
        fullWidth ? "w-full" : "inline-flex",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const hasBadge = option.badge !== undefined && option.badge !== null && option.badge !== "";

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 transition-colors duration-200 outline-none whitespace-nowrap font-bold",
              itemRadiusClass,
              size === "sm" && "py-1.5 px-3 text-xs",
              size === "md" && "py-2 px-3.5 text-xs sm:text-sm",
              size === "lg" && "py-2.5 px-5 text-sm sm:text-base",
              fullWidth ? "flex-1" : "flex-1 sm:flex-none sm:min-w-[90px]",
              isActive
                ? isQuickRail
                  ? "text-white"
                  : "text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/40"
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
                  itemRadiusClass,
                  isQuickRail && "bg-accent shadow-xs",
                  isGlass && "bg-surface-raised shadow-xs border border-border-subtle/80",
                  variant === "soft-inset" && "bg-surface-base shadow-xs border border-border-subtle/60"
                )}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            {option.icon && (
              <span className="relative z-10 shrink-0">{option.icon}</span>
            )}
            <span className="relative z-10">{option.label}</span>
            {hasBadge && (
              <span
                className={cn(
                  "relative z-10 text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors leading-none",
                  isActive
                    ? isQuickRail
                      ? "bg-white/20 text-white"
                      : "bg-accent/15 text-accent"
                    : option.badgeVariant === "error"
                    ? "bg-semantic-error text-white shadow-xs"
                    : option.badgeVariant === "accent"
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "bg-surface-muted text-text-muted border border-border-subtle"
                )}
              >
                {option.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

