"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

export function ReaderProgress() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  // Disable spring if reduced motion is preferred
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001
  });

  return (
    <div 
      className="fixed left-0 right-0 h-[2px] z-[100] pointer-events-none"
      style={{ top: 'var(--safe-top, 0px)' }}
    >
      <motion.div
        className="h-full bg-accent origin-left"
        style={{ scaleX: shouldReduceMotion ? scrollYProgress : scaleX }}
      />
    </div>
  );
}
