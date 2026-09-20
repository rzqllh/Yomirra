"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowCounterClockwise, House, Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center gap-6 px-6 text-center overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        {/* Glowing aura */}
        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-accent/15 dark:bg-accent/10 rounded-full blur-[80px] md:blur-[120px]" />
        
        {/* Floating elements simulating manga panels */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[-5%] md:top-[15%] md:left-[15%] w-32 h-40 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl shadow-glass opacity-60 backdrop-blur-md rotate-12"
        />
        <motion.div
          animate={{ y: [15, -15, 15], rotate: [4, -4, 4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] right-[-10%] md:bottom-[20%] md:right-[15%] w-48 h-32 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl shadow-glass opacity-50 backdrop-blur-md -rotate-6"
        />
        <motion.div
          animate={{ y: [-15, 15, -15], x: [-5, 5, -5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[30%] right-[0%] md:top-[25%] md:right-[30%] w-20 h-20 bg-white/30 dark:bg-white/5 border border-white/20 rounded-2xl shadow-glass opacity-40 backdrop-blur-sm rotate-45"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)", y: 20 }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-center justify-center w-full max-w-[240px] md:max-w-[320px] aspect-square drop-shadow-2xl mb-2 md:mb-4"
      >
        <Image
          src="/assets/error-cat.png"
          alt="500 Error"
          fill
          className="object-contain"
          priority
        />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3 z-10 max-w-[320px] md:max-w-md"
      >
        <h2 className="text-[28px] md:text-3xl font-black tracking-tight text-text-primary">
          Terjadi Kesalahan
        </h2>
        <p className="text-[15px] md:text-base text-text-secondary leading-relaxed font-medium">
          Aplikasi mengalami masalah yang tidak terduga. Silakan coba muat ulang halaman{isHome ? "." : " atau kembali ke beranda."}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3 mt-4 z-10 w-full max-w-[320px]"
      >
        <Button 
          variant="accent" 
          onClick={() => reset()}
          className="h-[52px] rounded-[18px] shadow-lg shadow-accent/25 font-bold w-full text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <ArrowCounterClockwise className="mr-2.5" size={20} weight="bold" />
          Coba Lagi
        </Button>
        {!isHome && (
          <Button 
            variant="outline" 
            asChild
            className="h-[52px] rounded-[18px] font-bold border border-border-strong w-full text-[15px] bg-surface-glass backdrop-blur-md hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98] transition-all text-text-primary"
          >
            <Link href="/">
              <House className="mr-2.5" size={20} weight="fill" />
              Kembali ke Beranda
            </Link>
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-[320px] mt-2"
      >
        <div className="flex items-center gap-4 py-4 w-full opacity-60">
          <div className="flex-1 h-px bg-border-default"></div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">atau</span>
          <div className="flex-1 h-px bg-border-default"></div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-base border border-border-default/50 text-left mt-2">
          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center shrink-0 border border-border-default shadow-xs">
            <Question size={20} weight="duotone" className="text-text-secondary" />
          </div>
          <div className="flex flex-col pt-0.5">
            <span className="text-[13px] font-bold text-text-primary">Masih bermasalah?</span>
            <span className="text-[13px] font-medium text-text-secondary leading-snug mt-0.5">Silakan coba beberapa saat lagi.</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
