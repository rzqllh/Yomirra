"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { cn } from "@/shared/utils/cn";
import { usePWAInstall } from "@/shared/hooks/use-pwa-install";
import { DownloadSimple } from "@phosphor-icons/react";

const STEPS = [
  {
    eyebrow: "BACA • JELAJAHI • NIKMATI",
    title: "Semua Cerita\ndalam Satu Tempat",
    desc: "Yomirra menyatukan komik dari berbagai sumber ke dalam satu aplikasi yang nyaman.",
  },
  {
    eyebrow: "KOLEKSI PRIBADI",
    title: "Simpan & Lacak\nFavoritmu",
    desc: "Library mengikuti sumber komik. Bookmark menyimpan riwayat agar tak pernah tertinggal.",
  },
  {
    eyebrow: "SELALU UPDATE",
    title: "Pencarian &\nLintas Sumber",
    desc: "Cari manga favoritmu dengan cepat dan dapatkan chapter baru dari berbagai ekstensi.",
  },
  {
    eyebrow: "READER PREMIUM",
    title: "Pengalaman\nTanpa Gangguan",
    desc: "Progress baca tersimpan otomatis. Sesuaikan arah, kecerahan, dan mode baca sesukamu.",
  },
];

const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
];

function getCardStyle(index: number, currentStep: number, totalCards: number) {
  const offset = (index - (currentStep % totalCards) + totalCards) % totalCards;
  if (offset === 0) return { rotate: 0, y: 0, scale: 1, zIndex: 10, opacity: 1, x: 0 };
  if (offset === 1) return { rotate: 7, y: 15, scale: 0.95, zIndex: 5, opacity: 0.9, x: 15 };
  if (offset === 2) return { rotate: -7, y: 15, scale: 0.95, zIndex: 4, opacity: 0.9, x: -15 };
  return { rotate: 0, y: 30, scale: 0.9, zIndex: 1, opacity: 0, x: 0 };
}

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const { completeOnboarding } = useOnboardingStore();
  const { isInstallable, installPWA } = usePWAInstall();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isReadyToExit, setIsReadyToExit] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [covers, setCovers] = React.useState<string[]>([]);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      if (!isReadyToExit) {
        document.body.style.overflow = "";
      }
    };
  }, [isReadyToExit]);

  // Init phase
  React.useEffect(() => {
    setIsMounted(true);
    
    // 1. Extract covers from local stores (fast cache)
    const libraryItems = Object.values(useLibraryStore.getState().items || {});
    const historyItems = Object.values(useHistoryStore.getState().items || {});
    
    const extractedCovers = new Set<string>();
    libraryItems.forEach(item => { if (item.coverUrl) extractedCovers.add(item.coverUrl); });
    historyItems.forEach(item => { if (item.coverUrl) extractedCovers.add(item.coverUrl); });
    
    const availableCovers = Array.from(extractedCovers);
    const shuffled = availableCovers.sort(() => 0.5 - Math.random());
    const cacheCovers = shuffled.slice(0, 3);
    
    if (cacheCovers.length >= 3) {
      setCovers(cacheCovers);
      return;
    }
    
    // 2. Set branded fallback immediately (non-blocking UI)
    const initialFallback = [...cacheCovers];
    while (initialFallback.length < 3) {
      initialFallback.push(FALLBACK_COVERS[initialFallback.length]);
    }
    setCovers(initialFallback);

    // 3. Fetch from existing API in background
    let isCancelled = false;
    
    fetch('/api/sources/komikindo/popular?page=1')
      .then(res => {
        if (!res.ok) throw new Error("API response not ok");
        return res.json();
      })
      .then(data => {
        if (isCancelled) return;
        const apiCovers = (data?.mangas || [])
          .map((m: any) => m.coverUrl)
          .filter(Boolean);
          
        if (apiCovers.length >= 3) {
          // Shuffle API covers for a stable random selection this session
          const shuffledApi = apiCovers.sort(() => 0.5 - Math.random()).slice(0, 3);
          setCovers(shuffledApi);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Onboarding] Cover API fallback failed, keeping branded fallback.", err.message);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (isReadyToExit) {
      document.body.style.overflow = "";
      completeOnboarding();
      onComplete();
    }
  }, [isReadyToExit, completeOnboarding, onComplete]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsReadyToExit(true);
  };

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[9000] flex flex-col bg-background h-[100dvh] overflow-hidden"
    >
          {/* Ambient Background Gradient (Subtle) */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
             <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-accent/20 blur-[120px] rounded-full" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[120%] bg-accent/10 blur-[100px] rounded-full" />
          </div>

          {/* Header (Safe Area Respected) */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-[calc(var(--safe-top,env(safe-area-inset-top))+20px)] w-full">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/icon.png" alt="Yomirra" fill className="object-contain drop-shadow-sm" priority unoptimized />
              </div>
              <span className="font-bold tracking-tight text-lg text-text-primary">Yomirra</span>
            </div>
            <button 
              onClick={handleComplete}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-raised active:bg-surface-raised/80 transition-colors"
            >
              Lewati
            </button>
          </div>

          {/* Cards Hero Area */}
          <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 min-h-0">
            <div className="relative flex items-center justify-center w-full max-w-[260px] h-[340px] sm:max-w-[280px] sm:h-[380px]">
              {covers.map((url, i) => {
                const style = getCardStyle(i, step, covers.length);
                return (
                  <motion.div
                    key={`cover-${i}`}
                    animate={{ 
                      y: style.y, 
                      rotate: style.rotate,
                      scale: style.scale,
                      opacity: style.opacity,
                      x: style.x
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, mass: 1 }}
                    className="absolute w-[200px] h-[280px] sm:w-[220px] sm:h-[320px] rounded-[24px] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-white/5 bg-surface-raised"
                    style={{ zIndex: style.zIndex }}
                  >
                    <Image src={url} alt="Cover" fill className="object-cover" unoptimized priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-60" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Content & CTA (Safe Area Respected) */}
          <div className="relative z-10 flex flex-col px-6 pb-[calc(var(--safe-bottom,env(safe-area-inset-bottom))+24px)] w-full max-w-[400px] mx-auto">
            {/* Crossfading Content */}
            <div className="h-[140px] flex flex-col justify-end text-center mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-2"
                >
                  <p className="text-[11px] font-bold tracking-[0.25em] text-accent uppercase drop-shadow-sm">
                    {STEPS[step].eyebrow}
                  </p>
                  <h2 className="text-[28px] leading-[1.1] font-extrabold tracking-tight text-text-primary whitespace-pre-line">
                    {STEPS[step].title}
                  </h2>
                  <p className="text-[15px] font-medium text-text-muted mt-2 leading-relaxed">
                    {STEPS[step].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2 mb-8 h-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    step === i ? "w-6 bg-accent" : "w-2 bg-border-strong hover:bg-border-subtle"
                  )}
                  aria-label={`Step ${i + 1}`}
                  aria-current={step === i ? "step" : undefined}
                />
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleNext}
                className={cn(
                  "w-full h-14 rounded-[20px] font-bold text-[17px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                  step === STEPS.length - 1 
                    ? "bg-accent hover:bg-accent-hover text-white shadow-[0_8px_20px_-6px_rgba(var(--accent),0.5)]" 
                    : "bg-surface-raised border border-border-subtle text-text-primary hover:bg-surface-raised/80"
                )}
              >
                {step === STEPS.length - 1 ? "Mulai Sekarang" : "Lanjut"}
                {step === STEPS.length - 1 && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              
              {/* Install PWA Button (Only on final step if installable) */}
              <AnimatePresence>
                {step === STEPS.length - 1 && isInstallable && (
                  <motion.button
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 48, marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onClick={installPWA}
                    className="w-full rounded-[16px] font-bold text-[15px] bg-surface-overlay border border-accent/30 text-accent hover:bg-accent/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <DownloadSimple size={20} weight="bold" />
                    Install Aplikasi Yomirra
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
    </motion.div>
  );
}
