"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * A wrapper for page-level components to transition smoothly between routes.
 * Using framer-motion for reliable cross-browser transitions.
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col min-w-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
