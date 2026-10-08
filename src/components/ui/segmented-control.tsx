"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { motion, useReducedMotion } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";

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
  ariaLabel?: string;
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
  ariaLabel,
}: SegmentedControlProps) {
  const instanceId = React.useId();
  const reducedMotion = useReducedMotion();
  const scopedLayoutId = `${layoutId}-${instanceId}`;
  const isPill = shape === "pill";
  const isQuickRail = variant === "quick-rail";
  const isGlass = variant === "glass-floating";

  // - Pill: Both outer container and inner indicator are rounded-full.
  // - Rounded: Outer rounded-xl with p-1 padding requires inner rounded-md (14px squircle)
  //   satisfying R_inner = R_outer - padding to prevent corner pinching/bulging.
  const containerRadiusClass = isPill ? "rounded-full" : "rounded-xl";
  const itemRadiusClass = isPill ? "rounded-full" : "rounded-md";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative flex items-center p-1 select-none",
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
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            className={cn(
              "relative z-10 flex min-h-11 items-center justify-center gap-1.5 motion-safe:transition-colors motion-safe:duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 whitespace-nowrap font-bold",
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
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId={reducedMotion ? undefined : scopedLayoutId}
                className={cn(
                  "absolute inset-0 z-0 transition-shadow",
                  itemRadiusClass,
                  isQuickRail && "bg-accent shadow-xs",
                  isGlass && "bg-surface-raised shadow-xs border border-border-subtle/80",
                  variant === "soft-inset" && "bg-surface-base shadow-xs border border-border-subtle/60"
                )}
                initial={false}
                transition={reducedMotion ? { duration: 0 } : transitions.layout}
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

