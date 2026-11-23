"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";
import { useAuth } from "@/shared/hooks/use-auth";
import { useOnboardingStore } from "@/shared/store/onboarding-store";

// Preserve the existing guest recovery path when boot dependencies are slow.
// This is an upper bound for waiting, not a minimum display duration.
const BOOT_RECOVERY_TIMEOUT_MS = 2000;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { loading: authLoading } = useAuth();
  const { _hasHydrated: hasHydrated } = useOnboardingStore();
  const reducedMotion = useReducedMotion();
  const completed = React.useRef(false);

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
      onComplete();
    };

    if (!authLoading && hasHydrated) {
      finish();
      return;
    }

    const timeout = window.setTimeout(finish, BOOT_RECOVERY_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [authLoading, hasHydrated, onComplete]);

  return (
    <motion.div
      data-testid="splash-screen"
      initial={false}
      exit={{ opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : transitions.gentle}
      className="fixed inset-0 z-[var(--z-takeover)] flex items-center justify-center bg-surface-base text-text-primary"
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
