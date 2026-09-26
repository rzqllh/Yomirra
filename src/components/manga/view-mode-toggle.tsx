"use client";

import * as React from "react";
import { SquaresFour, Rows } from "@phosphor-icons/react";
import { useSettingsStore } from "@/shared/store/settings-store";
import { cn } from "@/shared/utils/cn";

import { motion, useReducedMotion } from "motion/react";

export interface ViewModeToggleProps {
  className?: string;
  value?: "grid" | "compact";
  onChange?: (mode: "grid" | "compact") => void;
}

export function ViewModeToggle({ className, value, onChange }: ViewModeToggleProps) {
  const storeMode = useSettingsStore((state) => state.listingViewMode);
  const setStoreMode = useSettingsStore((state) => state.setListingViewMode);
  const reducedMotion = useReducedMotion();

  const activeMode = value ?? storeMode;
  const handleToggle = (mode: "grid" | "compact") => {
    if (onChange) {
      onChange(mode);
    } else {
      setStoreMode(mode);
    }
  };

  return (
    <div
      role="group"
      aria-label="Mode Tampilan Listing"
      className={cn(
        "inline-flex items-center p-1 rounded-xl bg-surface-glass backdrop-blur-md border border-border-subtle shadow-xs shrink-0",
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleToggle("grid")}
        aria-label="Tampilan Card Grid"
        aria-pressed={activeMode === "grid"}
        className={cn(
          "relative flex items-center justify-center h-8 w-8 rounded-lg transition-colors duration-150 z-10",
          activeMode === "grid"
            ? "text-white"
            : "text-text-muted hover:text-text-primary hover:bg-surface-hover/50 active:scale-95"
        )}
      >
        {activeMode === "grid" && (
          <motion.div
            layoutId={reducedMotion ? undefined : "viewmode-pill"}
            className="absolute inset-0 bg-accent rounded-lg shadow-xs -z-10"
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
          />
        )}
        <SquaresFour size={17} weight={activeMode === "grid" ? "fill" : "bold"} />
      </button>

      <button
        type="button"
        onClick={() => handleToggle("compact")}
        aria-label="Tampilan Kompak"
        aria-pressed={activeMode === "compact"}
        className={cn(
          "relative flex items-center justify-center h-8 w-8 rounded-lg transition-colors duration-150 z-10",
          activeMode === "compact"
            ? "text-white"
            : "text-text-muted hover:text-text-primary hover:bg-surface-hover/50 active:scale-95"
        )}
      >
        {activeMode === "compact" && (
          <motion.div
            layoutId={reducedMotion ? undefined : "viewmode-pill"}
            className="absolute inset-0 bg-accent rounded-lg shadow-xs -z-10"
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
          />
        )}
        <Rows size={17} weight={activeMode === "compact" ? "fill" : "bold"} />
      </button>
    </div>
  );
}
