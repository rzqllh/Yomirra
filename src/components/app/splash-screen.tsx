"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useAuth } from "@/shared/hooks/use-auth";
import { useOnboardingStore } from "@/shared/store/onboarding-store";

const MINIMUM_SPLASH_DURATION = 1200;
const WATCHDOG_TIMEOUT = 10000;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { loading: authLoading } = useAuth();
  const { _hasHydrated: hasHydrated } = useOnboardingStore();
  
  const [isMounted, setIsMounted] = React.useState(false);
  const [bootStartTime] = React.useState(() => Date.now());
  const [statusText, setStatusText] = React.useState("Menyiapkan Yomirra...");
  const [isReadyToExit, setIsReadyToExit] = React.useState(false);
  const [isTakingTooLong, setIsTakingTooLong] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    document.body.style.overflow = "hidden"; // Lock scroll
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Update status based on actual boot phase (only if it hasn't timed out)
  React.useEffect(() => {
    if (isMounted && !isTakingTooLong) {
      if (authLoading || !hasHydrated) {
        setStatusText("Menyiapkan Yomirra...");
      }
    }
  }, [authLoading, hasHydrated, isMounted, isTakingTooLong]);

  // Main Boot Logic
  React.useEffect(() => {
    if (!isMounted) return;

    let timeoutId: NodeJS.Timeout;
    
    // Check if critical boot dependencies are resolved
    const isBootComplete = !authLoading && hasHydrated;

    if (isBootComplete && !isTakingTooLong) {
      const elapsed = Date.now() - bootStartTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_DURATION - elapsed);

      timeoutId = setTimeout(() => {
        setIsReadyToExit(true);
      }, remainingTime);
    }

    return () => clearTimeout(timeoutId);
  }, [isMounted, authLoading, hasHydrated, bootStartTime, isTakingTooLong]);

  // Watchdog Timer
  React.useEffect(() => {
    if (!isMounted || isReadyToExit) return;

    const watchdogId = setTimeout(() => {
      // If we are still here after 10 seconds, it's taking too long
      setIsTakingTooLong(true);
      setStatusText("Memuat lebih lama dari biasanya...");
    }, WATCHDOG_TIMEOUT);

    return () => clearTimeout(watchdogId);
  }, [isMounted, isReadyToExit]);

  // Exit trigger
  React.useEffect(() => {
    if (isReadyToExit) {
      document.body.style.overflow = ""; // Restore scroll before unmount
      onComplete();
    }
  }, [isReadyToExit, onComplete]);

  // Prevent hydration mismatch
  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* Blurred Background Gradient */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-b from-accent/15 via-background to-background" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.8, 0.6] 
          }}
          transition={{ 
            duration: 4, 
            ease: "easeInOut", 
            repeat: Infinity 
          }}
          className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" 
        />
        <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[120%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-20">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mb-5 relative w-[100px] h-[100px]"
        >
          <Image 
            src="/icon.png" 
            alt="Yomirra Logo" 
            fill 
            className="object-contain drop-shadow-md" 
            priority 
            unoptimized
          />
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center text-center gap-2"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Yomirra</h1>
          <p className="text-[14px] font-medium text-text-muted max-w-[200px] leading-relaxed">
            Baca lintas sumber, lebih nyaman.
          </p>
        </motion.div>
      </div>

      {/* Loading Indicator or Failure State */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-4 w-full px-8"
      >
        <AnimatePresence mode="wait">
          {!isTakingTooLong ? (
            <motion.div 
              key="loading-bar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <div className="w-full max-w-[180px] h-1 rounded-full bg-surface-raised overflow-hidden">
                <motion.div 
                  className="h-full bg-accent rounded-full origin-left"
                  initial={{ scaleX: 0, x: "-100%" }}
                  animate={{ 
                    scaleX: [1, 0.5, 1],
                    x: ["-100%", "0%", "100%"] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "easeInOut",
                    repeat: Infinity 
                  }}
                />
              </div>
              <motion.p 
                key={statusText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-semibold text-text-muted"
              >
                {statusText}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="failure-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-sm font-medium text-text-primary">Yomirra belum siap</p>
              <p className="text-xs text-text-muted text-center max-w-[250px]">
                Koneksi atau sistem memuat lebih lama dari biasanya.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-full bg-surface-raised text-text-primary font-semibold text-sm hover:bg-surface-elevated transition-colors border border-border-subtle shadow-sm mt-2"
              >
                Coba Lagi
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
