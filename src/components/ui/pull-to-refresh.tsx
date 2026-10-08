"use client";

import * as React from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ArrowDown, ArrowsClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/utils/cn";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
}

const THRESHOLD = 80;
const MAX_PULL = 150;
const GESTURE_SLOP = 10;
const EDGE_SWIPE_ZONE = 24;

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const refreshingRef = React.useRef(false);
  const refreshActionRef = React.useRef(onRefresh);
  const reducedMotion = useReducedMotion();
  const pullDistance = useSpring(0, { stiffness: 300, damping: 25, bounce: 0 });
  const rotation = useTransform(pullDistance, [0, THRESHOLD], [0, 180], { clamp: true });
  const router = useRouter();

  React.useEffect(() => {
    refreshActionRef.current = onRefresh;
  }, [onRefresh]);

  React.useEffect(() => {
    let tracking = false;
    let pulling = false;
    let startX = 0;
    let startY = 0;
    let distance = 0;
    let disposed = false;

    const resetGesture = () => {
      tracking = false;
      pulling = false;
      distance = 0;
      setIsPulling(false);
      if (!refreshingRef.current) pullDistance.set(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current || event.touches.length !== 1 || window.scrollY > 0) {
        tracking = false;
        return;
      }

      const touch = event.touches[0];
      // Keep native iOS edge-swipe Back and horizontal content scrolling intact.
      if (touch.clientX <= EDGE_SWIPE_ZONE || touch.clientX >= window.innerWidth - EDGE_SWIPE_ZONE) {
        tracking = false;
        return;
      }

      tracking = true;
      pulling = false;
      distance = 0;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!tracking || refreshingRef.current || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (!pulling && Math.abs(deltaX) > GESTURE_SLOP && Math.abs(deltaX) >= Math.abs(deltaY)) {
        tracking = false;
        return;
      }

      if (deltaY <= GESTURE_SLOP || window.scrollY > 0) {
        if (pulling) resetGesture();
        return;
      }

      pulling = true;
      distance = Math.min(deltaY * 0.4, MAX_PULL);
      setIsPulling(true);
      if (event.cancelable) event.preventDefault();
      pullDistance.set(reducedMotion ? 0 : distance);
    };

    const handleTouchEnd = () => {
      if (!tracking) return;
      const shouldRefresh = pulling && distance >= THRESHOLD;
      resetGesture();
      if (!shouldRefresh || refreshingRef.current) return;

      refreshingRef.current = true;
      setIsRefreshing(true);
      pullDistance.set(reducedMotion ? 0 : 60);

      void (async () => {
        try {
          if (refreshActionRef.current) {
            await refreshActionRef.current();
          } else {
            router.refresh();
            // Next.js router.refresh() does not return a completion promise.
            await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
          }
        } catch (error) {
          console.error("Pull-to-refresh failed", error);
        } finally {
          refreshingRef.current = false;
          if (!disposed) {
            setIsRefreshing(false);
            pullDistance.set(0);
          }
        }
      })();
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", resetGesture);

    return () => {
      disposed = true;
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", resetGesture);
    };
  }, [pullDistance, reducedMotion, router]);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center"
        style={{ y: pullDistance }}
      >
        <div
          className={cn(
            "absolute -top-12 flex size-10 items-center justify-center rounded-xl border border-border-default/30 bg-surface-glass text-text-primary shadow-md backdrop-blur-md motion-safe:transition-opacity motion-safe:duration-200",
            isPulling || isRefreshing ? "opacity-100" : "opacity-0"
          )}
        >
          {isRefreshing ? (
            <motion.div
              animate={reducedMotion ? undefined : { rotate: 360 }}
              transition={reducedMotion ? { duration: 0 } : { repeat: Infinity, ease: "linear", duration: 1 }}
            >
              <ArrowsClockwise size={20} weight="bold" className="text-accent" aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div style={{ rotate: reducedMotion ? 0 : rotation }}>
              <ArrowDown size={20} weight="bold" className="text-text-secondary" aria-hidden="true" />
            </motion.div>
          )}
        </div>
      </motion.div>
      {isRefreshing && <span role="status" className="sr-only">Memuat ulang halaman…</span>}
      {children}
    </>
  );
}
