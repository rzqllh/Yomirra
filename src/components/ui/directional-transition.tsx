"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { useSafeMotion } from "@/shared/hooks/use-safe-motion";
import { motionEase, motionDuration } from "@/shared/lib/motion/tokens";

/**
 * Uniform wrapper for page-level route transitions across all pages in Yomirra.
 * Uses smooth, performance-optimized opacity, vertical shift, and blur transitions.
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { skipAnimations } = useSafeMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
        transition={{
          duration: skipAnimations ? 0 : motionDuration.normal,
          ease: motionEase.standard as [number, number, number, number],
        }}
        className="flex-1 flex flex-col min-w-0 w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
