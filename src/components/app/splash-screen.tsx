"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Logo from "@/logo/icon.png";
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
      {/* Ambient Multi-Layer Radial Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Pulsing center aura */}
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
        {/* Top ambient depth */}
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-accent/10 blur-[130px] opacity-40" />
        {/* Bottom deep tint */}
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full bg-indigo-950/30 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-20">
        {/* Floating Concentric Squircle Emblem */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 relative group"
        >
          {/* Subtle breathing rim glow */}
          <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-b from-accent/30 to-accent/5 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative size-24 sm:size-28 flex items-center justify-center rounded-[28px] bg-surface-raised/85 border border-white/15 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_35px_rgba(99,102,241,0.2)] ring-1 ring-white/10">
            {/* Specular highlight rim */}
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            
            <Image 
              src={Logo} 
              alt="Yomirra Logo" 
              width={68} 
              height={68} 
              className="object-contain relative z-10 drop-shadow-md select-none" 
              priority 
              unoptimized
            />
          </div>
        </motion.div>

        {/* High-Contrast Modern Typography */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-2"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/70 drop-shadow-sm">
            Yomirra
          </h1>
          <p className="text-xs sm:text-sm font-medium text-white/50 max-w-[260px] leading-relaxed">
            Satu tempat untuk semua manga favoritmu.
          </p>
        </motion.div>
      </div>

      {/* Loading Indicator or Non-blocking Warning State */}
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
              <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">
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
              <p className="text-sm font-medium text-white/90">
                Memuat lebih lama dari biasanya
              </p>
              <p className="text-xs text-white/50 max-w-[260px] leading-relaxed">
                Kami masih menyiapkan Yomirra. Periksa koneksi jika proses ini tidak selesai.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-full bg-white/10 text-white font-semibold text-xs hover:bg-white/15 transition-colors border border-white/15 shadow-sm mt-2 active:scale-95 cursor-pointer"
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
