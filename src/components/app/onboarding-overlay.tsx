"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { cn } from "@/shared/utils/cn";
import { usePWAInstall } from "@/shared/hooks/use-pwa-install";
import { DownloadSimple } from "@phosphor-icons/react";

const STEPS = [
  {
    eyebrow: "SEMUA SUMBER, SATU PINTU",
    title: "Ribuan Judul.\nNggak Perlu Pindah App.",
    desc: "Semua ketemu di sini, tanpa buka tab baru.",
  },
  {
    eyebrow: "RAK & RIWAYAT",
    title: "Berhenti di Sini,\nLanjut Persis di Sini.",
    desc: "Panel terakhir yang kamu baca, tersimpan otomatis. Buka lagi kapan aja, gak ada yang hilang.",
  },
  {
    eyebrow: "PENCARIAN LINTAS SUMBER",
    title: "Satu Judul,\nSemua Pilihan Sekaligus.",
    desc: "Bandingin mana yang rilis duluan, mana yang gambarnya lebih tajam, langsung dari satu pencarian.",
  },
  {
    eyebrow: "READER YANG NGERTI KAMU",
    title: "Scroll Panjang\natau Balik Halaman.",
    desc: "Mode Webtoon, preload otomatis biar kuota aman, layar tetap nyala pas kamu lagi khusyuk.",
  },
];

const FALLBACK_COVERS = [
  "/covers/cover-1.webp",
  "/covers/cover-2.webp",
  "/covers/cover-3.webp",
];

function getCardStyle(index: number, currentStep: number, totalCards: number) {
  const offset = (index - (currentStep % totalCards) + totalCards) % totalCards;
  if (offset === 0) return { y: 0, scale: 1, zIndex: 10, opacity: 1, filter: "brightness(100%)" };
  if (offset === 1) return { y: -16, scale: 0.92, zIndex: 5, opacity: 0.65, filter: "brightness(88%)" };
  if (offset === 2) return { y: -30, scale: 0.84, zIndex: 3, opacity: 0.35, filter: "brightness(75%)" };
  return { y: -42, scale: 0.78, zIndex: 1, opacity: 0, filter: "brightness(60%)" };
}

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const { completeOnboarding } = useOnboardingStore();
  const { isInstallable, installPWA } = usePWAInstall();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isReadyToExit, setIsReadyToExit] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [covers, setCovers] = React.useState<string[]>(FALLBACK_COVERS);

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

    const libraryItems = Object.values(useLibraryStore.getState().items || {});
    const historyItems = Object.values(useHistoryStore.getState().items || {});

    const extractedCovers = new Set<string>();
    libraryItems.forEach(item => { if (item.coverUrl) extractedCovers.add(item.coverUrl); });
    historyItems.forEach(item => { if (item.coverUrl) extractedCovers.add(item.coverUrl); });

    const availableCovers = Array.from(extractedCovers);
    if (availableCovers.length >= 3) {
      const shuffled = availableCovers.sort(() => 0.5 - Math.random());
      setCovers(shuffled.slice(0, 3));
      return;
    }

    let isCancelled = false;

    async function loadLiveCovers() {
      const sources = ["shinigami", "komikindo", "mangadex", "kiryuu"];
      for (const source of sources) {
        if (isCancelled) return;
        try {
          const res = await fetch(`/api/sources/${source}/popular?page=1`);
          if (!res.ok) continue;
          const data = await res.json();
          const mangas = data?.data?.mangas || data?.mangas || [];
          const validCovers = mangas
            .map((m: any) => m.coverUrl)
            .filter((url: any) => typeof url === "string" && url.startsWith("http"));

          if (validCovers.length >= 3) {
            const shuffledApi = validCovers.sort(() => 0.5 - Math.random()).slice(0, 3);
            if (!isCancelled) {
              setCovers(shuffledApi);
            }
            break;
          }
        } catch {
          // Continue to next available source
        }
      }
    }

    loadLiveCovers();

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

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStep(prev => Math.max(0, prev - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9000] flex flex-col bg-surface-base text-text-primary h-[100dvh] overflow-hidden select-none"
    >
      {/* Subtle adaptive ambient aura */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-accent/6 dark:bg-accent/14 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-[calc(var(--safe-top,env(safe-area-inset-top))+16px)] w-full">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl overflow-hidden bg-surface-raised border border-border-subtle shadow-xs p-0.5 flex items-center justify-center">
            <img
              src="/icon-pwa.png"
              alt="Yomirra"
              width={28}
              height={28}
              className="w-full h-full object-cover rounded-[8px] select-none"
            />
          </div>
          <span className="font-extrabold tracking-tight text-base sm:text-lg text-text-primary">
            Yomirra
          </span>
        </div>
        <button
          type="button"
          onClick={handleComplete}
          className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-raised active:scale-95 transition-all cursor-pointer"
        >
          Lewati
        </button>
      </header>

      {/* Straight Depth Stack Showcase */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4 min-h-0">
        <div className="relative flex items-center justify-center w-full max-w-[260px] h-[320px] sm:max-w-[280px] sm:h-[360px]">
          {covers.map((url, i) => {
            const style = getCardStyle(i, step, covers.length);
            return (
              <motion.div
                key={`cover-${i}`}
                animate={{
                  y: style.y,
                  scale: style.scale,
                  opacity: style.opacity,
                  filter: style.filter,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 26, mass: 1 }}
                className="absolute w-[190px] h-[270px] sm:w-[210px] sm:h-[300px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-border-subtle bg-surface-raised"
                style={{ zIndex: style.zIndex }}
              >
                <img
                  src={url}
                  alt="Cover Komik"
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = FALLBACK_COVERS[i % FALLBACK_COVERS.length];
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-50" />
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Editorial Content & CTA Actions */}
      <footer className="relative z-10 flex flex-col px-6 pb-[calc(var(--safe-bottom,env(safe-area-inset-bottom))+20px)] w-full max-w-[400px] mx-auto">
        <div className="h-[140px] flex flex-col justify-end text-center mb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-1.5"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
                {STEPS[step].eyebrow}
              </p>
              <h2 className="text-2xl sm:text-[28px] leading-tight font-extrabold tracking-tight text-text-primary whitespace-pre-line">
                {STEPS[step].title}
              </h2>
              <p className="text-xs sm:text-sm font-normal text-text-muted mt-1 leading-relaxed">
                {STEPS[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Segmented Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 h-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                step === i ? "w-6 bg-accent" : "w-2 bg-border-strong hover:bg-border-subtle"
              )}
              aria-label={`Langkah ${i + 1}`}
              aria-current={step === i ? "step" : undefined}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "w-full h-12 sm:h-13 rounded-2xl font-bold text-sm sm:text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer",
              step === STEPS.length - 1
                ? "bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/25"
                : "bg-surface-raised hover:bg-surface-hover border border-border-subtle text-text-primary"
            )}
          >
            {step === STEPS.length - 1 ? "Mulai Membaca" : "Lanjut"}
            {step === STEPS.length - 1 && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Install PWA Button (Only on final step if installable) */}
          <AnimatePresence>
            {step === STEPS.length - 1 && isInstallable && (
              <motion.button
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 44, marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                onClick={installPWA}
                className="w-full rounded-2xl font-bold text-xs sm:text-sm bg-surface-overlay border border-border-subtle text-accent hover:bg-accent/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <DownloadSimple size={18} weight="bold" />
                Install Aplikasi Yomirra
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </motion.div>
  );
}
