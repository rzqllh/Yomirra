"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { cn } from "@/shared/utils/cn";
import { usePWAInstall } from "@/shared/hooks/use-pwa-install";
import { ArrowRight, DownloadSimple, Export, PlusSquare } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STEPS = [
  {
    eyebrow: "SEMUA SUMBER, SATU PINTU",
    title: "Jelajahi komik lintas sumber",
    desc: "Akses ribuan judul dari berbagai sumber lokal dan internasional dalam satu tempat.",
  },
  {
    eyebrow: "KUSTOMISASI & KENYAMANAN",
    title: "Baca dengan caramu",
    desc: "Pilih mode gulir vertikal Webtoon atau balik halaman per halaman dengan pencatatan riwayat otomatis.",
  },
  {
    eyebrow: "SIAP MEMBACA",
    title: "Temukan bacaan berikutnya",
    desc: "Cari judul favoritmu, tambahkan ke Koleksi, atau lanjutkan bacaan kapan saja langsung di Yomirra.",
  },
];

const STEP_ARTWORK = [
  "/covers/cover-1.webp",
  "/covers/cover-2.webp",
  "/covers/cover-3.webp",
];

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const { completeOnboarding } = useOnboardingStore();
  const { isInstallable, installPWA, isIOS, showIOSGuide, setShowIOSGuide } = usePWAInstall();
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
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsReadyToExit(true);
  };

  // Keyboard navigation + focus containment for the full-screen onboarding dialog.
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
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9000] flex h-dvh flex-col overflow-y-auto bg-surface-base text-text-primary"
    >
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] sm:px-8">
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
          ref={skipButtonRef}
          type="button"
          onClick={handleComplete}
          className="min-h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-raised motion-safe:active:scale-95 motion-safe:transition-[transform,background-color,color] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Lewati
        </button>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-4 px-4 pt-3 pb-[calc(var(--safe-bottom)+16px)] sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-10 lg:gap-16">
        <div aria-hidden="true" className="relative isolate grid h-[clamp(190px,40svh,310px)] place-items-center overflow-hidden rounded-2xl border border-border-default bg-surface-muted md:h-[clamp(360px,65svh,620px)] md:rounded-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,var(--color-accent-dim),transparent_72%)]" />
          <div className="absolute aspect-[2/3] h-[69%] -translate-x-8 -rotate-12 rounded-xl border border-border-strong bg-surface-hover shadow-lg md:-translate-x-12" />
          <div className="absolute aspect-[2/3] h-[72%] translate-x-8 rotate-12 rounded-xl border border-border-strong bg-surface-overlay shadow-lg md:translate-x-12" />
          <img
            src={STEP_ARTWORK[step]}
            alt=""
            className="relative aspect-[2/3] h-[79%] rounded-xl border border-border-glass object-cover shadow-xl"
            decoding="async"
          />
          <span className="absolute bottom-3 left-3 rounded-full border border-border-default bg-surface-overlay px-2.5 py-1 text-xs font-semibold tabular-nums text-text-secondary">
            0{step + 1} / 0{STEPS.length}
          </span>
        </div>

        <section className="flex w-full flex-col md:py-6">
          <div aria-live="polite" className="mb-2 min-h-28 md:mb-5 md:min-h-48">
            <motion.div
              key={step}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25 }}
              className="flex flex-col gap-1.5"
            >
              <p className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
                {STEPS[step].eyebrow}
              </p>
              <h2 id="onboarding-title" className="max-w-[16ch] text-balance text-[28px] font-extrabold leading-[1.06] tracking-tight text-text-primary sm:text-4xl lg:text-[clamp(42px,4vw,62px)]">
                {STEPS[step].title}
              </h2>
              <p id="onboarding-description" className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary md:text-base">
                {STEPS[step].desc}
              </p>
            </motion.div>
        </div>

        {/* Segmented Step Indicator */}
        <div className="-ml-2 mb-2 flex min-h-11 items-center md:mb-4">
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
                  "h-2 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300",
                  step === i ? "w-6 bg-accent" : "w-2 bg-border-strong group-hover:bg-border-subtle"
                )}
              />
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleNext}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-on shadow-md shadow-accent/20 outline-none transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
          >
            {step === STEPS.length - 1 ? "Mulai Membaca" : "Lanjut"}
            <ArrowRight aria-hidden="true" size={20} />
          </button>

          {/* Install PWA Button (Only on final step if installable) */}
          <AnimatePresence>
            {step === STEPS.length - 1 && isInstallable && (
              <motion.button
                initial={reducedMotion ? false : { opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 44, marginTop: 8 }}
                exit={reducedMotion ? { opacity: 1, height: 44, marginTop: 8 } : { opacity: 0, height: 0, marginTop: 0 }}
                transition={reducedMotion ? { duration: 0 } : undefined}
                onClick={installPWA}
                className="w-full min-h-11 rounded-lg font-bold text-xs sm:text-sm bg-surface-overlay border border-border-subtle text-accent hover:bg-accent/10 motion-safe:active:scale-[0.98] motion-safe:transition-[transform,background-color,color,border-color] flex items-center justify-center gap-2 cursor-pointer"
              >
                <DownloadSimple size={18} weight="regular" />
                Install Aplikasi Yomirra
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        </section>
      </div>

      {/* iOS Safari Add to Home Screen Guidance Dialog (Q134-Q147) */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-sm rounded-xl bg-surface-overlay border border-border-default/80 p-5 text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Export size={20} className="text-accent" weight="regular" />
              <span>Pasang di iPhone / iPad</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              Yomirra dirancang sebagai PWA mandiri tanpa browser chrome.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 pt-2 text-xs text-text-secondary">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent font-bold shrink-0">
                1
              </span>
              <p className="leading-relaxed">
                Ketuk tombol <strong>Bagikan (Share)</strong> <Export size={14} className="inline mx-0.5 text-accent" weight="regular" /> di bilah navigasi Safari.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent font-bold shrink-0">
                2
              </span>
              <p className="leading-relaxed">
                Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong> <PlusSquare size={14} className="inline mx-0.5 text-accent" weight="regular" />.
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
            className="w-full mt-2 min-h-11 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Mengerti
          </button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
