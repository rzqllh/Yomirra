"use client";

import * as React from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("size-9 rounded-[10px] bg-surface-raised border border-border-subtle shrink-0", className)} />
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? "light" : "dark";

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const update = () => {
      setTheme(nextTheme);
    };

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document !== "undefined" && "startViewTransition" in document && !isReducedMotion) {
      const transition = (document as any).startViewTransition(update);
      transition.ready
        ?.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 550,
              easing: "cubic-bezier(.2, .8, .2, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {});
    } else {
      update();
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={reducedMotion ? undefined : { scale: 0.92 }}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className={cn(
        "relative flex items-center justify-center size-9 rounded-[10px] bg-surface-raised hover:bg-surface-hover transition-colors outline-none border border-border-subtle hover:border-accent/40 text-text-primary shrink-0 cursor-pointer shadow-xs overflow-hidden",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="dark-sun"
            initial={reducedMotion ? false : { opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center text-accent"
            aria-hidden="true"
          >
            <Sun size={18} weight="duotone" />
          </motion.span>
        ) : (
          <motion.span
            key="light-moon"
            initial={reducedMotion ? false : { opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center text-text-secondary"
            aria-hidden="true"
          >
            <Moon size={18} weight="duotone" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
