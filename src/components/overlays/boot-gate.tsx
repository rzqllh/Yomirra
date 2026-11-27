"use client";

import * as React from "react";
import { AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "./splash-screen";
import { OnboardingOverlay } from "./onboarding-overlay";
import { useOnboardingStore } from "@/shared/store/onboarding-store";

// Bounds AnimatePresence exit settlement so a stalled transition never strands an overlay in the DOM.
const OVERLAY_EXIT_SETTLE_MS = 600;

export function BootGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // start in boot phase
  const [phase, setPhase] = React.useState<"boot" | "onboarding" | "app">("boot");
  const [splashExitSettled, setSplashExitSettled] = React.useState(false);
  const [onboardingExitSettled, setOnboardingExitSettled] = React.useState(true);
  const [splashResetKey, setSplashResetKey] = React.useState(0);
  const [onboardingResetKey, setOnboardingResetKey] = React.useState(0);

  const handleSplashComplete = React.useCallback(() => {
    setSplashExitSettled(false);
    if (useOnboardingStore.getState().hasCompletedOnboarding) {
      setPhase("app");
      import("@/shared/lib/canonical-migration").then((m) => m.runCanonicalMigration());
    } else {
      setPhase("onboarding");
    }
  }, []);

  const handleOnboardingComplete = React.useCallback(() => {
    setOnboardingExitSettled(false);
    setPhase("app");
    import("@/shared/lib/canonical-migration").then((m) => m.runCanonicalMigration());
  }, []);

  const handleSplashExitComplete = React.useCallback(() => {
    setSplashExitSettled(true);
  }, []);

  const handleOnboardingExitComplete = React.useCallback(() => {
    setOnboardingExitSettled(true);
  }, []);

  React.useEffect(() => {
    if (isAdmin || phase === "boot" || splashExitSettled) return;
    const timeout = window.setTimeout(() => {
      setSplashExitSettled(true);
      setSplashResetKey((key) => key + 1);
    }, OVERLAY_EXIT_SETTLE_MS);
    return () => window.clearTimeout(timeout);
  }, [isAdmin, phase, splashExitSettled]);

  React.useEffect(() => {
    if (isAdmin || phase !== "app" || onboardingExitSettled) return;
    const timeout = window.setTimeout(() => {
      setOnboardingExitSettled(true);
      setOnboardingResetKey((key) => key + 1);
    }, OVERLAY_EXIT_SETTLE_MS);
    return () => window.clearTimeout(timeout);
  }, [isAdmin, phase, onboardingExitSettled]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence
        key={`splash-${splashResetKey}`}
        onExitComplete={handleSplashExitComplete}
      >
        {phase === "boot" && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence
        key={`onboarding-${onboardingResetKey}`}
        onExitComplete={handleOnboardingExitComplete}
      >
        {phase === "onboarding" && (
          <OnboardingOverlay key="onboarding" onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <div
        className={phase === "app" ? undefined : "pointer-events-none"}
        aria-hidden={phase !== "app"}
        inert={phase !== "app" ? true : undefined}
      >
        {children}
      </div>
    </>
  );
}
