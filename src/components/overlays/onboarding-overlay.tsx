"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { cn } from "@/shared/utils/cn";
import { usePWAInstall } from "@/shared/hooks/use-pwa-install";
import { ArrowRight, ArrowLeft, DownloadSimple, Export, PlusSquare, Sparkle } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface OnboardingStep {
  eyebrow: string;
  title: string;
  desc: string;
  artwork: string;
  series: string;
  creator: string;
}

const STEPS: OnboardingStep[] = [
  {
    eyebrow: "SEMUA SUMBER, SATU PINTU",
    title: "Jelajahi komik lintas sumber",
    desc: "Akses ribuan judul dari berbagai sumber lokal dan internasional dalam satu tempat tanpa repot berpindah aplikasi.",
    artwork: "/covers/cover-1.webp",
    series: "Solo Leveling",
    creator: "DUBU (REDICE STUDIO)",
  },
  {
    eyebrow: "KUSTOMISASI & KENYAMANAN",
    title: "Baca dengan caramu",
    desc: "Pilih mode gulir vertikal Webtoon atau balik halaman per halaman dengan pencatatan riwayat otomatis yang presisi.",
    artwork: "/covers/cover-2.webp",
    series: "Nano Machine",
    creator: "Gugwo / Jeol-Moo Hyeon",
  },
  {
    eyebrow: "SIAP MEMBACA",
    title: "Temukan bacaan berikutnya",
    desc: "Cari judul favoritmu, simpan ke Koleksi, atau lanjutkan bacaan kapan saja langsung di Yomirra.",
    artwork: "/covers/cover-3.webp",
    series: "Omniscient Reader",
    creator: "Sleepy-C / sing N song",
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

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    setIsReadyToExit(true);
  };

  // Keyboard navigation + focus containment for full-screen dialog
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
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.01 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9000] flex h-dvh flex-col overflow-y-auto bg-surface-base text-text-primary selection:bg-accent/20"
    >
      {/* Ambient Backdrop Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] rounded-full bg-accent/8 blur-[120px] dark:bg-accent/12" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-accent/5 blur-[100px] dark:bg-accent/8" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.02),transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[calc(var(--safe-top)+16px)] pb-2 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl overflow-hidden bg-surface-raised border border-border-default/80 shadow-xs p-1 flex items-center justify-center">
            <img
              src="/icon-pwa.png"
              alt="Yomirra"
              width={28}
              height={28}
              className="w-full h-full object-cover rounded-lg select-none"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-base sm:text-lg text-text-primary leading-none">
              Yomirra
            </span>
            <span className="text-[10px] font-semibold text-text-muted tracking-wider uppercase mt-0.5">
              Multi-Source Reader
            </span>
          </div>
        </div>

        <button
          ref={skipButtonRef}
          type="button"
          onClick={handleComplete}
          className="group inline-flex items-center gap-1.5 min-h-11 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-raised border border-transparent hover:border-border-subtle motion-safe:active:scale-95 motion-safe:transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span>Lewati</span>
          <ArrowRight
            size={14}
            className="text-text-muted group-hover:text-text-primary transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </header>

      {/* Main Content Showcase */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-8 px-4 pt-2 pb-[calc(var(--safe-bottom)+20px)] sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-12 lg:gap-16">
        {/* Left Column: Tangible Manga Volume Stage */}
        <div
          aria-hidden="true"
          className="relative isolate flex items-center justify-center h-[clamp(260px,46svh,360px)] md:h-[clamp(420px,64svh,580px)] rounded-3xl border border-border-default/60 bg-gradient-to-b from-surface-raised/80 via-surface-muted/50 to-surface-raised/90 p-6 md:p-10 shadow-sm overflow-hidden"
        >
          {/* Subtle manga grid background accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#8882_1px,transparent_1px)] [background-size:20px_20px] opacity-40 dark:opacity-20" />
          
          {/* Dynamic artwork backlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,var(--color-accent-dim),transparent_75%)] opacity-80" />

          {/* Stacked Manga Depth Volumes (Stylized architectural card panels) */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Background Layer 1 (Left tilt) */}
            <div
              className={cn(
                "absolute aspect-[2/3] h-[78%] rounded-2xl border border-border-strong/70 bg-gradient-to-tr from-surface-muted via-surface-hover/80 to-surface-raised/90 shadow-md transition-all duration-500",
                step === 0 && "-translate-x-8 -rotate-6 scale-95 opacity-60",
                step === 1 && "-translate-x-10 -rotate-8 scale-95 opacity-70",
                step === 2 && "-translate-x-7 -rotate-5 scale-95 opacity-60"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent rounded-l-2xl" />
            </div>

            {/* Background Layer 2 (Right tilt) */}
            <div
              className={cn(
                "absolute aspect-[2/3] h-[81%] rounded-2xl border border-border-strong/70 bg-gradient-to-tl from-surface-raised via-surface-hover/90 to-surface-muted/80 shadow-lg transition-all duration-500",
                step === 0 && "translate-x-8 rotate-6 scale-95 opacity-70",
                step === 1 && "translate-x-7 rotate-5 scale-95 opacity-60",
                step === 2 && "translate-x-10 rotate-8 scale-95 opacity-70"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent rounded-l-2xl" />
            </div>

            {/* Active Foreground Manga Volume */}
            <div className="relative aspect-[2/3] h-[86%] rounded-2xl overflow-hidden border border-border-glass shadow-[0_20px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
              <img
                src={current.artwork}
                alt=""
                className="w-full h-full object-cover select-none motion-safe:transition-all motion-safe:duration-300"
                decoding="async"
              />

              {/* Book Spine Highlight Effect (Tactile volume feel) */}
              <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/40 via-white/15 to-transparent rounded-l-2xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

              {/* Bottom Cover Tag */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white/95">
                <div className="flex flex-col truncate pr-2">
                  <span className="text-xs font-bold truncate drop-shadow-md">
                    {current.series}
                  </span>
                  <span className="text-[10px] text-white/75 truncate drop-shadow-sm font-medium">
                    {current.creator}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-black/50 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                  0{step + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Editorial Edition Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-border-default/80 bg-surface-raised/90 backdrop-blur-md px-3 py-1 shadow-xs">
            <Sparkle size={12} weight="fill" className="text-accent" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-text-secondary tabular-nums">
              Edisi 0{step + 1} / 0{STEPS.length}
            </span>
          </div>
        </div>

        {/* Right Column: Editorial Copy & Interactive Stepper */}
        <section className="flex w-full flex-col justify-center md:py-4">
          <div aria-live="polite" className="min-h-36 md:min-h-48 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-2.5"
              >
                {/* Eyebrow Micro-Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 w-fit">
                  <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
                  <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
                    {current.eyebrow}
                  </p>
                </div>

                {/* Display Title */}
                <h2
                  id="onboarding-title"
                  className="text-balance text-3xl font-extrabold leading-[1.12] tracking-tight text-text-primary sm:text-4xl lg:text-5xl"
                >
                  {current.title}
                </h2>

                {/* Refined Description */}
                <p
                  id="onboarding-description"
                  className="mt-1 max-w-prose text-sm leading-relaxed text-text-secondary sm:text-base"
                >
                  {current.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper Navigation Pills with 44px Touch Targets */}
          <div className="mt-6 mb-6 flex items-center gap-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className="group flex size-11 items-center justify-center rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={`Langkah ${i + 1}`}
                aria-current={step === i ? "step" : undefined}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2 rounded-full motion-safe:transition-all motion-safe:duration-300",
                    step === i
                      ? "w-7 bg-accent shadow-xs shadow-accent/30"
                      : "w-2 bg-border-strong group-hover:bg-border-subtle group-hover:w-3"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-raised px-4 text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-[0.98] transition-all cursor-pointer"
                aria-label="Kembali ke langkah sebelumnya"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="group inline-flex min-h-12 flex-1 sm:flex-initial sm:min-w-[200px] cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-accent px-6 text-sm font-bold text-accent-on shadow-md shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
            >
              <span>{step === STEPS.length - 1 ? "Mulai Membaca" : "Lanjut"}</span>
              <ArrowRight
                aria-hidden="true"
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            {/* Install PWA Button (On final step if installable) */}
            <AnimatePresence>
              {step === STEPS.length - 1 && isInstallable && (
                <motion.button
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  onClick={installPWA}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface-raised border border-border-subtle px-5 text-sm font-bold text-accent hover:bg-accent/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <DownloadSimple size={18} weight="bold" />
                  <span>Install Aplikasi Yomirra</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

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
