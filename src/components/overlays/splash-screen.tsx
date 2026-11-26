"use client";

import * as React from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";
import { useAuth } from "@/shared/hooks/use-auth";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { cn } from "@/shared/utils/cn";

// Preserve the existing guest recovery path when boot dependencies are slow.
// This is an upper bound for waiting, not a minimum display duration.
const BOOT_RECOVERY_TIMEOUT_MS = 2000;
const noop = () => {};

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { loading: authLoading } = useAuth();
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const completed = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  React.useEffect(() => {
    const finish = () => {
      if (completed.current) return;
      completed.current = true;
      onCompleteRef.current();
    };

    if (!authLoading && hasHydrated) {
      finish();
      return;
    }

    const timeout = window.setTimeout(finish, BOOT_RECOVERY_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [authLoading, hasHydrated]);

  return (
    <motion.div
      data-testid="splash-screen"
      initial={false}
      exit={{ opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : transitions.gentle}
      // Keep exit opacity on Motion's JS frameloop so WebKit WAAPI onfinish stalls never pin the splash overlay.
      onUpdate={noop}
      className={cn(
        "fixed inset-0 z-[var(--z-takeover)] flex items-center justify-center bg-surface-base text-text-primary",
        !isPresent && "pointer-events-none"
      )}
    >
      <div role="status" className="flex items-center gap-3 text-sm font-medium text-text-secondary">
        <span
          aria-hidden="true"
          className="size-5 rounded-full border-2 border-border-default border-t-accent motion-safe:animate-spin"
        />
        <span>Menyiapkan aplikasi</span>
      </div>
    </motion.div>
  );
}
