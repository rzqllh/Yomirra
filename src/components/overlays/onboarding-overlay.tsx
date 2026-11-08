"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { cn } from "@/shared/utils/cn";
import { usePWAInstall } from "@/shared/hooks/use-pwa-install";
import { ArrowRight, ArrowLeft, DownloadSimple, Export, PlusSquare, Keyboard } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface OnboardingStep {
  eyebrow: string;
  title: string;
  desc: string;
  artwork: string;
  series: string;
  creator: string;
  glowColor: string;
  tip: string;
}

const STEPS: OnboardingStep[] = [
  {
    eyebrow: "SEMUA SUMBER, SATU PINTU",
    title: "Jelajahi komik lintas sumber",
    desc: "Baca manga, manhwa, dan manhua dari penyedia favorit di satu tempat. Tanpa iklan pop-up yang mengganggu dan tanpa repot bolak-balik banyak tab.",
    artwork: "/covers/cover-1.webp",
    series: "Solo Leveling",
    creator: "DUBU (REDICE STUDIO)",
    glowColor: "var(--color-accent)",
    tip: "Gunakan tombol panah keyboard ← → untuk navigasi cepat",
  },
  {
    eyebrow: "KUSTOMISASI & KENYAMANAN",
    title: "Baca komik dengan caramu",
    desc: "Dukungan mode gulir vertikal panjang atau balik halaman per halaman. Riwayat dan posisi bab terakhir selalu tersimpan otomatis.",
    artwork: "/covers/cover-2.webp",
    series: "Nano Machine",
    creator: "Gugwo / Jeol-Moo Hyeon",
    glowColor: "var(--color-accent)",
    tip: "Mode baca dapat diubah kapan saja di menu pembaca",
  },
  {
    eyebrow: "SIAP MEMBACA",
    title: "Temukan bacaan berikutnya",
    desc: "Simpan serial favorit ke rak buku pribadi, pantau rilis bab terbaru, atau langsung mulai membaca rekomendasi terpopuler hari ini.",
    artwork: "/covers/cover-3.webp",
    series: "Omniscient Reader",
    creator: "Sleepy-C / sing N song",
    glowColor: "var(--color-accent)",
    tip: "Koleksi tersimpan aman di perangkat dan siap dibaca",
  },
];

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const { completeOnboarding } = useOnboardingStore();
  const { isInstallable, installPWA, showIOSGuide, setShowIOSGuide } = usePWAInstall();
  const reducedMotion = useReducedMotion();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const skipButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isReadyToExit, setIsReadyToExit] = React.useState(false);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      if (!isReadyToExit) {
        document.body.style.overflow = "";
      }
    };
  }, [isReadyToExit]);

  React.useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return () => {
      const previous = previousFocusRef.current;
      if (previous?.isConnected) {
        previous.focus();
      }
      previousFocusRef.current = null;
    };
  }, []);

  React.useEffect(() => setIsMounted(true), []);

  React.useEffect(() => {
    if (!isMounted) return;
    queueMicrotask(() => skipButtonRef.current?.focus());
  }, [isMounted]);

  React.useEffect(() => {
    if (isReadyToExit) {
      document.body.style.overflow = "";
      completeOnboarding();
      onComplete();
    }
  }, [isReadyToExit, completeOnboarding, onComplete]);

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      goToStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      goToStep(step - 1);
    }
  };

  const handleComplete = () => {
    setIsReadyToExit(true);
  };

  // Keyboard navigation + focus containment
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;

        const focusable = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((element) => !element.hasAttribute("aria-hidden"));

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (!(active instanceof Node) || !root.contains(active)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  if (!isMounted) return null;

  const current = STEPS[step];

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.99 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[var(--z-takeover)] flex min-h-dvh flex-col justify-between overflow-y-auto bg-surface-base text-text-primary selection:bg-accent/20"
    >
      {/* Dynamic Ambient Color Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 35% 45%, ${current.glowColor}, transparent 70%)`,
          opacity: 0.12,
        }}
      />

      {/* Top Navigation Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-[calc(var(--safe-top)+16px)] pb-2 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl overflow-hidden bg-surface-raised border border-border-default shadow-xs p-1 flex items-center justify-center">
            <img
              src="/icon-pwa.png"
              alt="Yomirra"
              width={28}
              height={28}
              className="w-full h-full object-cover rounded-lg select-none"
            />
          </div>
          <span className="font-extrabold tracking-tight text-base sm:text-lg text-text-primary leading-tight">
            Yomirra
          </span>
        </div>

        <button
          ref={skipButtonRef}
          type="button"
          onClick={handleComplete}
          className="group inline-flex items-center gap-1.5 min-h-11 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-raised border border-transparent hover:border-border-subtle motion-safe:active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span>Lewati</span>
          <ArrowRight
            size={14}
            className="text-text-muted group-hover:text-text-primary transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </header>

      {/* Central Interactive Showcase Stage */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-6 sm:px-10">
        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 lg:gap-16 items-center">
          
          {/* Left Column: Physical 3D Manga Volume Presentation */}
          <div
            aria-hidden="true"
            className="relative flex flex-col items-center justify-center py-4 md:py-6"
          >
            {/* The Manga Book Deck Container */}
            <div className="relative w-56 sm:w-64 md:w-72 aspect-[2/3] perspective-1000">
              
              {/* Stacked Manga Volume 1 (Deep background layer) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-tr from-surface-muted to-surface-raised border border-border-default/80 shadow-md transition-all duration-500",
                  step === 0 && "-translate-x-5 translate-y-3 -rotate-6 opacity-60 scale-95",
                  step === 1 && "-translate-x-6 translate-y-4 -rotate-8 opacity-70 scale-95",
                  step === 2 && "-translate-x-4 translate-y-2 -rotate-5 opacity-60 scale-95"
                )}
              >
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent rounded-l-2xl" />
              </div>

              {/* Stacked Manga Volume 2 (Middle background layer) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-tl from-surface-raised to-surface-hover border border-border-default shadow-lg transition-all duration-500",
                  step === 0 && "translate-x-5 translate-y-2 rotate-6 opacity-70 scale-95",
                  step === 1 && "translate-x-4 translate-y-1 rotate-5 opacity-60 scale-95",
                  step === 2 && "translate-x-6 translate-y-3 rotate-7 opacity-70 scale-95"
                )}
              >
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent rounded-l-2xl" />
              </div>

              {/* Foreground Active Manga Volume — Pure artwork without text collision */}
              <motion.div
                key={step}
                initial={
                  reducedMotion
                    ? false
                    : {
                        opacity: 0.85,
                        scale: 0.98,
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 320,
                        damping: 26,
                      }
                }
                className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-xl bg-surface-raised cursor-default select-none"
              >
                <img
                  src={current.artwork}
                  alt=""
                  className="w-full h-full object-cover select-none pointer-events-none"
                  decoding="async"
                />

                {/* Physical Book Spine Gradient */}
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/50 via-white/15 to-transparent rounded-l-2xl pointer-events-none" />
              </motion.div>
            </div>

            {/* Volume Attribution & Counter — Cleanly Positioned Outside & Below Artwork */}
            <div className="w-56 sm:w-64 md:w-72 mt-3 flex items-center justify-between px-1 text-text-muted text-xs">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span className="font-semibold text-text-secondary truncate">{current.series}</span>
                <span className="text-text-muted select-none">·</span>
                <span className="text-text-muted truncate">{current.creator}</span>
              </div>
              <span className="shrink-0 rounded-full bg-surface-raised border border-border-subtle px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-text-secondary">
                0{step + 1} / 0{STEPS.length}
              </span>
            </div>
          </div>

          {/* Right Column: Editorial Copy & Unified Controls */}
          <div className="flex flex-col justify-center">
            
            {/* Content Container — Restored Natural Vertical Rhythm */}
            <div aria-live="polite" className="flex flex-col gap-4 sm:gap-6 min-h-[190px] justify-center">
              
              {/* Eyebrow Label */}
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                <p className="text-xs font-bold tracking-wider text-accent uppercase">
                  {current.eyebrow}
                </p>
              </div>

              {/* Display Headline */}
              <div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.h1
                    key={step}
                    id="onboarding-title"
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.18 }}
                    className="text-balance text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight text-text-primary"
                  >
                    {current.title}
                  </motion.h1>
                </AnimatePresence>
              </div>

              {/* Description Body — Human Editorial Prose (Deduped, No SaaS Bullets) */}
              <div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={step}
                    id="onboarding-description"
                    initial={reducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.18 }}
                    className="text-sm sm:text-base leading-relaxed text-text-secondary max-w-prose"
                  >
                    {current.desc}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Stable Action & Navigation Row — Strict Zero Clipping at 400px */}
            <div className="mt-6 pt-5 border-t border-border-subtle flex flex-col gap-3">
              
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                {/* Stepper Interactive Pills (size-11 touch target maintained) */}
                <div className="flex items-center gap-1 shrink-0">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToStep(i)}
                      className="group flex size-11 items-center justify-center rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      aria-label={`Langkah ${i + 1}`}
                      aria-current={step === i ? "step" : undefined}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          step === i
                            ? "w-8 bg-accent shadow-xs shadow-accent/30"
                            : "w-2.5 bg-border-strong group-hover:bg-border-subtle group-hover:w-3.5"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Navigation CTA Group — Responsive Geometry, Zero Clipping on Mobile */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial justify-end">
                  {/* Kembali Button: Always renders with consistent geometry, hidden on Step 0 */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    tabIndex={step === 0 ? -1 : 0}
                    aria-hidden={step === 0}
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center gap-1.5 px-3 sm:px-4 rounded-xl border border-border-default bg-surface-raised hover:bg-surface-hover text-xs sm:text-sm font-bold text-text-secondary hover:text-text-primary active:scale-[0.98] transition-all cursor-pointer",
                      step === 0 ? "hidden sm:invisible sm:w-26" : "visible opacity-100 w-auto sm:w-26"
                    )}
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden xs:inline">Kembali</span>
                  </button>

                  {/* Primary CTA: Responsive on mobile, rock-solid on desktop */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="group inline-flex min-h-11 flex-1 sm:flex-initial sm:w-44 cursor-pointer items-center justify-center gap-2 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-on font-bold text-xs sm:text-sm shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span>{step === STEPS.length - 1 ? "Mulai Membaca" : "Lanjut"}</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </div>

              {/* Bottom Utility Slot */}
              <div className="min-h-8 flex items-center">
                {step === STEPS.length - 1 && isInstallable ? (
                  <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-raised border border-border-default/80">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <DownloadSimple size={15} weight="bold" className="text-accent shrink-0" />
                      <span className="text-xs font-semibold text-text-secondary truncate">
                        Install Aplikasi Yomirra di perangkat
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={installPWA}
                      className="px-3 py-1 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Pasang
                    </button>
                  </div>
                ) : (
                  <div className="hidden [@media(hover:hover)_and_(pointer:fine)]:flex items-center gap-2 text-2xs text-text-muted px-1">
                    <Keyboard size={14} className="shrink-0 text-text-muted/80" />
                    <span className="truncate">{current.tip}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer spacer */}
      <footer className="relative z-20 pb-[calc(var(--safe-bottom)+12px)]" />

      {/* iOS Safari Add to Home Screen Guidance Dialog */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-sm rounded-2xl bg-surface-overlay border border-border-default/80 p-6 text-text-primary shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Export size={20} className="text-accent" weight="bold" />
              <span>Pasang di iPhone / iPad</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Yomirra dirancang sebagai PWA mandiri tanpa browser chrome.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-3 text-xs text-text-secondary">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent font-bold shrink-0">
                1
              </span>
              <p className="leading-relaxed">
                Ketuk tombol <strong>Bagikan (Share)</strong>{" "}
                <Export size={14} className="inline mx-0.5 text-accent" weight="bold" /> di bilah navigasi Safari.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent font-bold shrink-0">
                2
              </span>
              <p className="leading-relaxed">
                Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>{" "}
                <PlusSquare size={14} className="inline mx-0.5 text-accent" weight="bold" />.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent font-bold shrink-0">
                3
              </span>
              <p className="leading-relaxed">
                Ketuk <strong>&quot;Tambah&quot;</strong> di sudut kanan atas untuk membuka Yomirra layaknya aplikasi native.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIOSGuide(false)}
            className="w-full mt-3 min-h-11 rounded-xl bg-accent text-accent-on font-bold text-xs hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Mengerti
          </button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
