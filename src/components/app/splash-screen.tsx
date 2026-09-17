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
  const [isReadyToExit, setIsReadyToExit] = React.useState(false);
  const [isTakingTooLong, setIsTakingTooLong] = React.useState(false);

  // Preserve previous overflow on mount and restore on unmount
  React.useEffect(() => {
    setIsMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Main Boot Logic - Watchdog never halts boot if dependencies resolve late
  React.useEffect(() => {
    if (!isMounted) return;

    let timeoutId: NodeJS.Timeout;
    const isBootComplete = !authLoading && hasHydrated;

    if (isBootComplete) {
      const elapsed = Date.now() - bootStartTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_DURATION - elapsed);

      timeoutId = setTimeout(() => {
        setIsReadyToExit(true);
      }, remainingTime);
    }

    return () => clearTimeout(timeoutId);
  }, [isMounted, authLoading, hasHydrated, bootStartTime]);

  // Watchdog Timer (>10s notification only)
  React.useEffect(() => {
    if (!isMounted || isReadyToExit) return;

    const watchdogId = setTimeout(() => {
      setIsTakingTooLong(true);
    }, WATCHDOG_TIMEOUT);

    return () => clearTimeout(watchdogId);
  }, [isMounted, isReadyToExit]);

  // Exit trigger
  React.useEffect(() => {
    if (isReadyToExit) {
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
            sizes="100px"
            className="object-contain drop-shadow-md" 
            priority 
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
          <p className="text-[14px] font-medium text-text-muted max-w-[240px] leading-relaxed">
            Satu tempat untuk semua manga favoritmu.
          </p>
        </motion.div>
      </div>

      {/* Loading Indicator or Non-blocking Warning State */}
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
              <p className="text-xs font-semibold text-text-muted">
                Menyiapkan Yomirra...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="slow-warning-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <p className="text-sm font-medium text-text-primary">
                Memuat lebih lama dari biasanya
              </p>
              <p className="text-xs text-text-muted max-w-[250px] leading-relaxed">
                Kami masih menyiapkan Yomirra. Periksa koneksi jika proses ini tidak selesai.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-full bg-surface-raised text-text-primary font-semibold text-xs hover:bg-surface-elevated transition-colors border border-border-subtle shadow-sm mt-2 active:scale-95"
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
