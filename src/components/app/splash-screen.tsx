"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
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
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-surface-base text-text-primary select-none"
    >
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.55, 0.75, 0.55]
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-accent/25 via-accent/10 to-transparent blur-[110px]"
        />
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-accent/10 blur-[130px] opacity-40" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full bg-indigo-950/30 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-20">
        <motion.div
          initial={{ scale: 0.86, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 relative group"
        >
          <div className="absolute -inset-2.5 rounded-[32px] bg-accent/20 blur-xl opacity-80" />

          <div className="relative size-24 sm:size-28 rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(15,10,60,0.8),0_0_30px_rgba(99,102,241,0.35)] border border-white/20">
            <img
              src="/icon-pwa.png"
              alt="Yomirra Logo"
              width={112}
              height={112}
              className="w-full h-full object-cover select-none"
              loading="eager"
              decoding="sync"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-1.5"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
            Yomirra
          </h1>
          <p className="text-xs sm:text-sm font-medium text-text-secondary max-w-[260px] leading-relaxed">
            Semua Komik, Satu Rumah.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.45 }}
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
              <div className="w-full max-w-[180px] h-1 rounded-full bg-white/10 overflow-hidden relative backdrop-blur-md">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent/50 via-accent to-accent-hover rounded-full origin-left shadow-[0_0_12px_rgba(99,102,241,0.8)]"
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
              <p className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                Membuka Rak Kamu...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="slow-warning-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <p className="text-sm font-semibold text-text-primary">
                Koneksi Lagi Pelan
              </p>
              <p className="text-xs text-text-secondary max-w-[260px] leading-relaxed">
                Ini makan waktu lebih lama dari biasanya. Cek koneksi kamu, atau coba lagi.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-full bg-surface-raised text-text-primary font-semibold text-xs hover:bg-surface-hover transition-colors border border-white/15 shadow-sm mt-2 active:scale-95 cursor-pointer"
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
