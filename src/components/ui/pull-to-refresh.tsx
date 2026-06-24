"use client";

import React, { useState, useEffect } from "react";
import { motion, useSpring, useMotionValueEvent } from "motion/react";
import { ArrowDown, ArrowsClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/utils/cn";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
}

const THRESHOLD = 80;
const MAX_PULL = 150;

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistance = useSpring(0, { stiffness: 300, damping: 25, bounce: 0 });
  const router = useRouter();
  const [rotation, setRotation] = useState(0);

  useMotionValueEvent(pullDistance, "change", (latest) => {
    if (!isRefreshing && isPulling) {
      // Map 0 -> THRESHOLD to 0 -> 180 degrees
      const rot = Math.min((latest / THRESHOLD) * 180, 180);
      setRotation(rot);
    }
  });

  useEffect(() => {
    let startY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull to refresh if we are at the absolute top of the page
      if (window.scrollY <= 0) {
        isAtTop = true;
        startY = e.touches[0].clientY;
      } else {
        isAtTop = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        // Prevent default scroll (pull-to-refresh native browser behavior)
        if (e.cancelable) e.preventDefault();
        setIsPulling(true);
        // Add heavy resistance
        const resistantDistance = distance * 0.4;
        pullDistance.set(Math.min(resistantDistance, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      setIsPulling(false);

      if (pullDistance.get() > THRESHOLD) {
        setIsRefreshing(true);
        pullDistance.set(60); // Hold the spinner visible

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            router.refresh();
            // Minimum spinner duration
            await new Promise(r => setTimeout(r, 800));
          }
        } finally {
          setIsRefreshing(false);
          pullDistance.set(0);
        }
      } else {
        pullDistance.set(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, router, onRefresh, isPulling]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        style={{ y: pullDistance }}
      >
        <div 
          className={cn(
            "absolute -top-12 bg-surface-glass backdrop-blur-md shadow-md rounded-full w-10 h-10 flex items-center justify-center border border-border-default/30 text-text-primary transition-opacity duration-200",
            (isPulling || isRefreshing) ? "opacity-100" : "opacity-0"
          )}
        >
          {isRefreshing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            >
              <ArrowsClockwise size={20} weight="bold" className="text-accent" />
            </motion.div>
          ) : (
            <motion.div style={{ rotate: rotation }}>
              <ArrowDown size={20} weight="bold" className="text-text-secondary" />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {children}
    </>
  );
}
