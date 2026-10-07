"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useOnboardingStore } from "@/shared/store/onboarding-store";

const MINIMUM_SPLASH_DURATION = 950;
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
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-surface-base text-text-primary select-none"
    >
      {/* Subtle adaptive ambient aura */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 3.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="w-[420px] h-[420px] rounded-full bg-accent/8 dark:bg-accent/18 blur-[100px] pointer-events-none"
        />
      </div>

      {/* Brand Identity Showcase */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 relative"
        >
          <div className="absolute -inset-2 rounded-[28px] sm:rounded-[32px] bg-accent/10 blur-xl opacity-60 dark:opacity-80" />

          <div className="relative size-24 sm:size-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-surface-raised border border-border-subtle shadow-md dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-0.5">
            <img
              src="/icon-pwa.png"
              alt="Yomirra Logo"
              width={112}
              height={112}
              className="w-full h-full object-cover rounded-[14px] sm:rounded-[22px] select-none"
              loading="eager"
              decoding="sync"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-1.5"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary">
            Yomirra
          </h1>
          <p className="text-xs sm:text-sm font-medium text-text-muted max-w-[280px] leading-relaxed">
            Semua Komik, Satu Rumah.
          </p>
        </motion.div>
      </div>

      {/* Hairline Progress & Watchdog Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-3.5 w-full px-6"
      >
        <AnimatePresence mode="wait">
          {!isTakingTooLong ? (
            <motion.div
              key="loading-bar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <div className="w-full max-w-[160px] h-1.5 rounded-full bg-border-subtle overflow-hidden relative">
                <motion.div
                  className="h-full bg-accent rounded-full origin-left"
                  initial={{ scaleX: 0, x: "-100%" }}
                  animate={{
                    scaleX: [0.6, 0.4, 0.6],
                    x: ["-100%", "30%", "160%"],
                  }}
                  transition={{
                    duration: 1.4,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </div>
              <motion.p
                animate={{ opacity: [0.55, 0.95, 0.55] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                className="text-[11px] font-semibold tracking-wider text-text-muted uppercase"
              >
                Membuka Rak Kamu...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="slow-warning-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 text-center p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-md max-w-xs"
            >
              <p className="text-sm font-bold text-text-primary">
                Koneksi Lagi Pelan
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Ini makan waktu lebih lama dari biasanya. Cek koneksi kamu, atau coba lagi.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-xl bg-surface-overlay text-text-primary font-semibold text-xs hover:bg-surface-hover transition-colors border border-border-subtle shadow-xs mt-1 active:scale-95 cursor-pointer"
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
