"use client";

import * as React from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { cn } from "@/shared/utils/cn";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div className="w-[68px] h-9 rounded-full bg-surface-raised border border-border-subtle" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex w-[68px] h-9 items-center rounded-full p-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ",
        "bg-surface-glass backdrop-blur-md border border-border-glass  hover:bg-surface-hover/50"
      )}
      aria-label="Toggle theme"
    >
      <div className="relative flex w-full justify-between items-center z-10">
        <div className="w-7 h-7 flex items-center justify-center">
          <Moon 
            size={14} 
            weight="duotone"
            className={cn("transition-colors duration-300", isDark ? "text-text-primary" : "text-text-muted")} 
          />
        </div>
        <div className="w-7 h-7 flex items-center justify-center">
          <Sun 
            size={14} 
            weight="duotone"
            className={cn("transition-colors duration-300", !isDark ? "text-text-primary" : "text-text-muted")} 
          />
        </div>
      </div>
      
      {/* Sliding Pill Background */}
      <motion.div
        className="absolute top-1 w-7 h-7 rounded-full bg-surface-overlay border border-border-subtle  z-0"
        animate={{
          left: isDark ? "4px" : "36px",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </button>
  );
}
