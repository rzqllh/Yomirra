"use client";

import * as React from "react";
import { AnimatePresence } from "motion/react";
import { SplashScreen } from "./splash-screen";
import { OnboardingOverlay } from "./onboarding-overlay";
import { useOnboardingStore } from "@/shared/store/onboarding-store";

export function BootGate({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding } = useOnboardingStore();
  
  // start in boot phase
  const [phase, setPhase] = React.useState<"boot" | "onboarding" | "app">("boot");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSplashComplete = () => {
    if (hasCompletedOnboarding) {
      setPhase("app");
      import("@/shared/lib/canonical-migration").then(m => m.runCanonicalMigration());
    } else {
      setPhase("onboarding");
    }
  };

  const handleOnboardingComplete = () => {
    setPhase("app");
    import("@/shared/lib/canonical-migration").then(m => m.runCanonicalMigration());
  };

  if (!isMounted) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
        {phase === "onboarding" && (
          <OnboardingOverlay key="onboarding" onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>
      
      {phase === "app" && children}
    </>
  );
}
