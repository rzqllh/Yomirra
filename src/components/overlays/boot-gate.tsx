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
  const [exitSettled, setExitSettled] = React.useState(false);
  const [presenceResetKey, setPresenceResetKey] = React.useState(0);

  const handleSplashComplete = React.useCallback(() => {
    setExitSettled(false);
    if (useOnboardingStore.getState().hasCompletedOnboarding) {
      setPhase("app");
      import("@/shared/lib/canonical-migration").then((m) => m.runCanonicalMigration());
    } else {
      setPhase("onboarding");
    }
  }, []);

  const handleOnboardingComplete = React.useCallback(() => {
    setExitSettled(false);
    setPhase("app");
    import("@/shared/lib/canonical-migration").then((m) => m.runCanonicalMigration());
  }, []);

  const handleExitComplete = React.useCallback(() => {
    setExitSettled(true);
  }, []);

  React.useEffect(() => {
    if (isAdmin || phase === "boot" || exitSettled) return;
    const timeout = window.setTimeout(() => {
      setExitSettled(true);
      setPresenceResetKey((key) => key + 1);
    }, OVERLAY_EXIT_SETTLE_MS);
    return () => window.clearTimeout(timeout);
  }, [isAdmin, phase, exitSettled]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence
        key={presenceResetKey}
        mode="wait"
        onExitComplete={handleExitComplete}
      >
        {phase === "boot" && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
        {phase === "onboarding" && (
          <OnboardingOverlay key="onboarding" onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <div className={phase === "app" ? "contents" : "invisible pointer-events-none"} aria-hidden={phase !== "app"}>
        {children}
      </div>
    </>
  );
}
