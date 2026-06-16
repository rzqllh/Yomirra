"use client";

import * as React from "react";
import { motion, useScroll } from "motion/react";

export function ReaderProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <div 
      className="fixed left-0 right-0 h-[2px] z-[100] pointer-events-none"
      style={{ top: 'var(--safe-top, 0px)' }}
    >
      <motion.div
        className="h-full bg-accent origin-left"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  );
}
