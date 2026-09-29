"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Route-level cross-fade transition for Yomirra discovery and destination pages.
 * Runs 150-180ms easeOut opacity/subtle transform to prevent abrupt hard-cuts.
 * Drops to instant swap when prefers-reduced-motion is active.
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
        key={pathname}
        initial={reducedMotion ? false : { opacity: 0.94, x: 5 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0.98, x: -3 }}
        transition={{
          duration: reducedMotion ? 0 : 0.16,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex-1 flex flex-col min-w-0 w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
