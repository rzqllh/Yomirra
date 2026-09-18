"use client";

import * as React from "react";
import Link from "next/link";
import { 
  CaretLeft, 
  CaretRight, 
  CheckCircle, 
  Flag, 
  BookOpen, 
  Sparkle, 
  ArrowRight,
  ArrowsLeftRight,
  BookmarkSimple,
  SlidersHorizontal,
  ArrowUpRight
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Demo states
type ChapterState = "middle" | "first" | "last";

export default function ReaderEndDemoPage() {
  const [selectedVariant, setSelectedVariant] = React.useState<number>(10);
  const [chapterState, setChapterState] = React.useState<"middle" | "first" | "last">("middle");

  const hasPrev = chapterState === "middle" || chapterState === "last";
  const hasNext = chapterState === "middle" || chapterState === "first";

  const chapterTitle = "Chapter 42 - Kebangkitan Sang Raja";
  const nextChapterTitle = "Chapter 43 - Pertarungan Dimulai";
  const prevChapterTitle = "Chapter 41 - Gerbang Terbuka";

  const handleReport = () => {
    const subject = encodeURIComponent(`[Yomirra Bug] ${chapterTitle}`);
    const body = encodeURIComponent(
      `Halo Hafizh,\n\nSaya menemukan masalah pada chapter ini:\n- Judul: ${chapterTitle}\n- Sumber: Shinigami\n- Detail Kendala: `
    );
    window.location.href = `mailto:hrizqullah484@gmail.com?subject=${subject}&body=${body}`;
    toast.info("Membuka aplikasi email untuk melapor ke Hafizh...");
  };

  const handleNext = () => {
    toast.success("Membuka bab selanjutnya (Chapter 43)...");
  };

  const handlePrev = () => {
    toast.success("Membuka bab sebelumnya (Chapter 41)...");
  };

  return (
    <div className="min-h-screen bg-black text-text-primary pb-24">
      {/* Top Controls Header */}
      <div className="sticky top-0 z-50 bg-surface-base/90 backdrop-blur-xl border-b border-border-subtle px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-accent" />
                10 Konsep Redesign Akhir Bab Reader
              </h1>
              <p className="text-xs text-text-muted">
                Pilih varian untuk melihat preview nyata di kanvas komik gelap.
              </p>
            </div>
            <Link 
              href="/" 
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-border-subtle transition-colors"
            >
              Kembali
            </Link>
          </div>

          {/* Test Case Toggles */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-text-muted font-bold shrink-0">Simulasi:</span>
            <button
              onClick={() => setChapterState("middle")}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all shrink-0",
                chapterState === "middle" 
                  ? "bg-accent text-white" 
                  : "bg-surface-raised text-text-secondary hover:text-text-primary"
              )}
            >
              Bab Tengah (Ada Prev & Next)
            </button>
            <button
              onClick={() => setChapterState("first")}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all shrink-0",
                chapterState === "first" 
                  ? "bg-accent text-white" 
                  : "bg-surface-raised text-text-secondary hover:text-text-primary"
              )}
            >
              Bab 1 (Hanya Next)
            </button>
            <button
              onClick={() => setChapterState("last")}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all shrink-0",
                chapterState === "last" 
                  ? "bg-accent text-white" 
                  : "bg-surface-raised text-text-secondary hover:text-text-primary"
              )}
            >
              Bab Terakhir (Hanya Prev)
            </button>
          </div>

          {/* 10 Variants Selector Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              "1. Minimalist Edge",
              "2. Floating Glass Capsule",
              "3. Milestone Card",
              "4. Asymmetric Thumb",
              "5. Editorial Bookend",
              "6. Stealth HUD",
              "7. Pull Prompt",
              "8. Bento Grid",
              "9. Zen Stream",
              "10. Combined Final (3 + 10)"
            ].map((name, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariant(i + 1)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                  selectedVariant === i + 1
                    ? "bg-white text-black shadow-sm"
                    : "bg-surface-raised/60 hover:bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle/50"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Container (Simulating Phone Viewport) */}
      <div className="max-w-[420px] mx-auto mt-6 px-4">
        {/* Mock Last Manga Image */}
        <div className="relative w-full aspect-[9/13] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-indigo-950/40 to-black flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-mono">Halaman Terakhir (45/45)</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px]">Manga Panel</span>
          </div>

          <div className="text-center my-auto px-4 py-8">
            <p className="text-lg font-black text-white/90 tracking-tight leading-snug">
              &quot;Perjalanan belum berakhir... kita akan bertemu di ibukota!&quot;
            </p>
            <p className="text-xs text-white/40 mt-2 font-mono">Bersambung ke Chapter 43</p>
          </div>

          <div className="text-center text-[11px] text-white/30 font-mono">
            Akhir halaman komik
          </div>
        </div>

        {/* Dynamic Variant Render */}
        <div className="mt-8 transition-all duration-300">
          {selectedVariant === 1 && (
            /* VARIANT 1: The Minimalist Edge (Apple Books / Linear Style) */
            <div className="flex flex-col items-center gap-4 py-6 border-t border-white/10">
              <div className="flex items-center justify-between w-full text-xs font-semibold text-text-secondary">
                {hasPrev ? (
                  <button onClick={handlePrev} className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                    <CaretLeft size={16} /> Bab Sebelumnya
                  </button>
                ) : (
                  <span className="text-text-muted/40">Awal Komik</span>
                )}

                <Link href="/" className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                  Detail Komik
                </Link>

                {hasNext ? (
                  <button onClick={handleNext} className="text-accent font-bold hover:text-accent-hover transition-colors flex items-center gap-1 cursor-pointer">
                    Bab 43 <CaretRight size={16} />
                  </button>
                ) : (
                  <span className="text-text-muted/40">Bab Terbaru</span>
                )}
              </div>

              <button 
                onClick={handleReport}
                className="text-[11px] text-text-muted hover:text-semantic-error transition-colors flex items-center gap-1 cursor-pointer mt-2"
              >
                <Flag size={12} /> Laporkan kendala bab ini ke developer
              </button>
            </div>
          )}

          {selectedVariant === 2 && (
            /* VARIANT 2: The Floating Glass Capsule (iOS Dynamic Island Style) */
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-surface-overlay/80 backdrop-blur-2xl border border-white/15 shadow-glass w-full max-w-[340px] justify-between">
                {hasPrev && (
                  <button 
                    onClick={handlePrev}
                    aria-label="Bab Sebelumnya"
                    className="size-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/80 active:scale-90 transition-all cursor-pointer"
                  >
                    <CaretLeft size={18} weight="bold" />
                  </button>
                )}

                <button 
                  onClick={hasNext ? handleNext : () => toast.info("Kembali ke detail")}
                  className="flex-1 h-10 px-4 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer truncate"
                >
                  <span>{hasNext ? "Lanjut Bab 43" : "Kembali ke Detail"}</span>
                  <ArrowRight size={14} weight="bold" />
                </button>

                {hasNext && hasPrev && (
                  <button 
                    onClick={handleNext}
                    aria-label="Bab Selanjutnya"
                    className="size-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/80 active:scale-90 transition-all cursor-pointer"
                  >
                    <CaretRight size={18} weight="bold" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
                <Link href="/" className="hover:text-white transition-colors">Detail Komik</Link>
                <span>·</span>
                <button onClick={handleReport} className="hover:text-semantic-error transition-colors cursor-pointer">
                  Laporkan Chapter
                </button>
              </div>
            </div>
          )}

          {selectedVariant === 3 && (
            /* VARIANT 3: The Milestone Card (Mihon / Tachiyomi Modern) */
            <div className="rounded-[22px] bg-surface-raised/40 border border-border-subtle p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-subtle/40 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" className="text-semantic-success" />
                  <span className="text-xs font-bold text-text-primary">Chapter 42 Selesai</span>
                </div>
                <span className="text-[11px] text-text-muted font-mono">45 Halaman</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {hasNext && (
                  <Button 
                    onClick={handleNext}
                    className="w-full h-11 rounded-xl font-bold text-sm bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Baca Chapter 43</span>
                    <CaretRight size={16} weight="bold" />
                  </Button>
                )}

                <div className="flex items-center gap-2">
                  {hasPrev && (
                    <Button 
                      variant="outline"
                      onClick={handlePrev}
                      className="flex-1 h-10 rounded-xl font-semibold text-xs border-border-default hover:bg-surface-hover text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      <CaretLeft size={14} className="mr-1" /> Bab 41
                    </Button>
                  )}
                  <Link 
                    href="/" 
                    className="flex-1 h-10 rounded-xl font-semibold text-xs border border-border-default bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen size={14} /> Detail
                  </Link>
                </div>
              </div>

              <div className="text-center pt-1">
                <button onClick={handleReport} className="text-[11px] text-text-muted hover:text-semantic-error transition-colors cursor-pointer">
                  Laporkan masalah halaman rusak
                </button>
              </div>
            </div>
          )}

          {selectedVariant === 4 && (
            /* VARIANT 4: Asymmetric Thumb Flow (Webtoon Studio Pro) */
            <div className="flex flex-col gap-3 py-6">
              <div className="flex items-center gap-2.5 w-full">
                {hasPrev && (
                  <button
                    onClick={handlePrev}
                    aria-label="Bab Sebelumnya"
                    className="size-12 rounded-2xl bg-surface-raised/80 hover:bg-surface-hover border border-border-subtle flex items-center justify-center text-text-primary active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <CaretLeft size={20} weight="bold" />
                  </button>
                )}

                <button
                  onClick={hasNext ? handleNext : () => toast.info("Kembali ke detail")}
                  className="flex-1 h-12 rounded-2xl bg-accent hover:bg-accent-hover text-white font-extrabold text-sm flex items-center justify-between px-5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="truncate">{hasNext ? "Lanjut Chapter 43" : "Kembali ke Detail"}</span>
                  <CaretRight size={18} weight="bold" />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-text-muted">
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                  <BookOpen size={14} /> Daftar Bab
                </Link>
                <button onClick={handleReport} className="hover:text-semantic-error transition-colors flex items-center gap-1 cursor-pointer">
                  <Flag size={14} /> Laporkan
                </button>
              </div>
            </div>
          )}

          {selectedVariant === 5 && (
            /* VARIANT 5: Editorial Bookend (Substack / Medium Style) */
            <div className="flex flex-col items-center text-center gap-4 py-8 border-t border-white/10">
              <span className="text-white/20 text-sm tracking-widest font-mono">✦ ✦ ✦</span>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Akhir dari Chapter 42</h3>
                <p className="text-xs text-text-muted mt-0.5">Terima kasih telah membaca di Yomirra.</p>
              </div>

              <div className="flex items-center gap-6 pt-2 text-xs font-bold">
                {hasPrev && (
                  <button onClick={handlePrev} className="text-text-secondary hover:text-white hover:underline transition-all cursor-pointer">
                    ← Bab Sebelumnya
                  </button>
                )}
                <Link href="/" className="text-text-secondary hover:text-white hover:underline transition-all">
                  Detail Komik
                </Link>
                {hasNext && (
                  <button onClick={handleNext} className="text-accent hover:text-accent-hover hover:underline transition-all cursor-pointer">
                    Bab 43 Selanjutnya →
                  </button>
                )}
              </div>

              <button onClick={handleReport} className="text-[11px] text-text-muted hover:text-semantic-error pt-2 transition-colors cursor-pointer">
                Laporkan kendala gambar / bab
              </button>
            </div>
          )}

          {selectedVariant === 6 && (
            /* VARIANT 6: Stealth HUD (Dark Tech / Cyberpunk Minimal) */
            <div className="flex flex-col gap-3 py-6">
              <div className="grid grid-cols-3 rounded-xl border border-white/15 bg-black overflow-hidden divide-x divide-white/15 text-xs font-mono">
                <button 
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="py-3 px-2 flex items-center justify-center gap-1 text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <CaretLeft size={14} /> PREV
                </button>
                <Link 
                  href="/"
                  className="py-3 px-2 flex items-center justify-center gap-1 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                  DETAIL
                </Link>
                <button 
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="py-3 px-2 flex items-center justify-center gap-1 text-accent font-bold hover:text-accent-hover hover:bg-accent/10 disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  NEXT <CaretRight size={14} />
                </button>
              </div>

              <div className="text-center">
                <button onClick={handleReport} className="text-[10px] font-mono tracking-wider text-white/40 hover:text-semantic-error transition-colors cursor-pointer">
                  [!] REPORT_CORRUPTED_PAGE
                </button>
              </div>
            </div>
          )}

          {selectedVariant === 7 && (
            /* VARIANT 7: Sticky Pull Prompt (Kindle / MangaPlus Native) */
            <div className="rounded-2xl bg-gradient-to-b from-surface-raised/40 to-surface-raised/80 border border-border-subtle p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <BookmarkSimple size={20} weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-accent uppercase tracking-wider">Bab Berikutnya</p>
                  <h4 className="text-sm font-bold text-text-primary truncate">Chapter 43 - Pertarungan Dimulai</h4>
                </div>
              </div>

              <Button 
                onClick={handleNext}
                className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Buka Sekarang</span>
                <ArrowRight size={14} weight="bold" />
              </Button>

              <div className="flex items-center justify-between px-1 text-[11px] text-text-muted pt-1">
                {hasPrev ? (
                  <button onClick={handlePrev} className="hover:text-white transition-colors cursor-pointer">
                    ← Bab 41
                  </button>
                ) : <span />}
                <Link href="/" className="hover:text-white transition-colors">Detail Komik</Link>
                <button onClick={handleReport} className="hover:text-semantic-error transition-colors cursor-pointer">
                  Laporkan
                </button>
              </div>
            </div>
          )}

          {selectedVariant === 8 && (
            /* VARIANT 8: Bento Micro-Grid (iOS Control Center) */
            <div className="flex flex-col gap-2.5 py-6">
              {hasNext ? (
                <button 
                  onClick={handleNext}
                  className="w-full h-14 rounded-2xl bg-accent hover:bg-accent-hover text-white p-4 flex items-center justify-between font-bold text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Lanjut Membaca</span>
                    <span>Chapter 43</span>
                  </div>
                  <CaretRight size={20} weight="bold" />
                </button>
              ) : (
                <div className="w-full h-12 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center text-xs font-bold text-text-muted">
                  Kamu sudah di chapter terbaru
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {hasPrev ? (
                  <button 
                    onClick={handlePrev}
                    className="h-11 rounded-xl bg-surface-raised/70 hover:bg-surface-hover border border-border-subtle/70 text-text-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <CaretLeft size={16} /> Bab 41
                  </button>
                ) : (
                  <div className="h-11 rounded-xl bg-surface-raised/20 border border-border-subtle/30 flex items-center justify-center text-[11px] text-text-muted/40">
                    Awal Komik
                  </div>
                )}

                <Link 
                  href="/"
                  className="h-11 rounded-xl bg-surface-raised/70 hover:bg-surface-hover border border-border-subtle/70 text-text-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <BookOpen size={16} /> Detail
                </Link>
              </div>

              <div className="text-center pt-2">
                <button onClick={handleReport} className="text-[11px] text-text-muted hover:text-semantic-error transition-colors cursor-pointer">
                  Ada masalah dengan bab ini? Laporkan
                </button>
              </div>
            </div>
          )}

          {selectedVariant === 9 && (
            /* VARIANT 9: Zen Manga Stream (Japanese Minimalist) */
            <div className="flex flex-col items-center gap-5 py-10">
              <div className="w-8 h-0.5 bg-white/20 rounded-full" />
              
              <div className="text-center">
                <p className="text-xs font-mono text-text-muted tracking-widest uppercase">Chapter 42</p>
                <p className="text-sm font-medium text-text-secondary mt-1">Selesai</p>
              </div>

              <div className="flex items-center gap-8 text-xs font-bold">
                {hasPrev && (
                  <button onClick={handlePrev} className="text-text-muted hover:text-white transition-colors cursor-pointer">
                    ← Bab 41
                  </button>
                )}

                <Link href="/" className="text-text-muted hover:text-white transition-colors">
                  Daftar
                </Link>

                {hasNext && (
                  <button onClick={handleNext} className="text-white hover:text-accent transition-colors cursor-pointer">
                    Bab 43 →
                  </button>
                )}
              </div>

              <button onClick={handleReport} className="text-[10px] text-white/30 hover:text-semantic-error transition-colors pt-4 cursor-pointer">
                Lapor gambar rusak
              </button>
            </div>
          )}

          {selectedVariant === 10 && (
            /* VARIANT 10: Combined Final (3 Milestone + 10 Unified Dock on Pure Black Canvas) */
            <div className="w-full rounded-2xl bg-zinc-950/85 border border-white/[0.08] backdrop-blur-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
              {/* Header Status Line */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="size-2 rounded-full bg-semantic-success shrink-0" />
                  <span className="text-xs font-semibold text-white/90 truncate">
                    Chapter 42 selesai
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/40 shrink-0">
                  45 halaman
                </span>
              </div>

              {/* Primary Navigation Buttons (Ergonomic h-11 Apple HIG, Reusable Squircle) */}
              <div className="flex items-center gap-2.5 w-full">
                {hasPrev && (
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    className="h-11 px-4 font-semibold text-xs sm:text-sm bg-white/[0.05] hover:bg-white/[0.10] active:bg-white/[0.08] border-white/10 text-white/80 hover:text-white flex-1 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-none"
                  >
                    <CaretLeft size={16} weight="bold" />
                    <span>Sebelumnya</span>
                  </Button>
                )}

                {hasNext ? (
                  <Button
                    onClick={handleNext}
                    className={cn(
                      "h-11 px-4 font-semibold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_24px_rgba(108,106,250,0.35)]",
                      hasPrev ? "flex-1" : "w-full"
                    )}
                  >
                    <span>{hasPrev ? "Selanjutnya" : "Lanjut Bab Berikutnya"}</span>
                    <CaretRight size={16} weight="bold" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => toast.info("Mengarahkan ke halaman detail komik...")}
                    className={cn(
                      "h-11 px-4 font-semibold text-xs sm:text-sm bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(108,106,250,0.35)] cursor-pointer",
                      hasPrev ? "flex-1" : "w-full"
                    )}
                  >
                    <BookOpen size={16} weight="bold" />
                    <span>Detail Komik</span>
                  </Button>
                )}
              </div>

              {/* Utility Micro-actions */}
              <div className="flex items-center justify-center gap-3 text-xs text-white/40 pt-0.5">
                {hasNext && (
                  <>
                    <button 
                      onClick={() => toast.info("Mengarahkan ke halaman detail komik...")} 
                      className="hover:text-white/80 transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
                    >
                      <BookOpen size={13} />
                      <span>Detail Komik</span>
                    </button>
                    <span className="text-white/20">·</span>
                  </>
                )}
                <button 
                  onClick={handleReport} 
                  className="hover:text-semantic-error/90 transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
                >
                  <Flag size={13} />
                  <span>Laporkan kendala</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Variant Description Box */}
        <div className="mt-8 p-4 rounded-2xl bg-surface-raised/50 border border-border-subtle text-xs space-y-1.5">
          <p className="font-bold text-text-primary flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-accent" />
            Konsep Desain #{selectedVariant}
          </p>
          <p className="text-text-secondary leading-relaxed">
            {selectedVariant === 1 && "Minimalist Edge: Desain ala Apple Books / Linear. Tanpa balok tombol masif. Bersih, tenang, mengandalkan tipografi dan spasi halus."}
            {selectedVariant === 2 && "Floating Glass Capsule: Kapsul kaca floating transparan ala iOS Dynamic Island / Apple Music mini-player. Modern dan tidak memutus latar komik."}
            {selectedVariant === 3 && "Milestone Card: Kartu apresiasi ala Mihon / Tachiyomi modern. Memvalidasi pencapaian bab dengan tombol utama dan aksi sekunder modular."}
            {selectedVariant === 4 && "Asymmetric Thumb Flow: Ergonomis jempol satu tangan ala Webtoon Studio. Tombol 'Next' mendominasi 75% layar kanan, tombol 'Prev' berupa tombol ikon 25%."}
            {selectedVariant === 5 && "Editorial Bookend: Penutup sastrawi ala Substack / majalah seni. Tanpa kotak tombol plastik, mengandalkan teks bergaris bawah halus dan ornamen lembut."}
            {selectedVariant === 6 && "Stealth HUD: Tampilan dark tech / monochrome cyberpunk. Menyatu 100% dengan background hitam murni dengan border tipis dan segmented control."}
            {selectedVariant === 7 && "Sticky Pull Prompt: Format ala Kindle / MangaPlus. Memberikan informasi judul bab berikutnya di dalam card sebelum tombol 'Buka Sekarang'."}
            {selectedVariant === 8 && "Bento Micro-Grid: Grid bento 2 tingkat modular ala iOS Control Center. Akses jempol seimbang ke navigasi dan detail."}
            {selectedVariant === 9 && "Zen Manga Stream: Pendekatan Jepang murni. Tanpa border atau kartu sama sekali. Whitespace lapang dan tipografi monokrom santai."}
            {selectedVariant === 10 && "Combined Final (3 + 10): Menggabungkan Milestone Card dan Unified Dock. Header status bab dan jumlah halaman yang tenang, tombol navigasi ergonomis 44px (Apple HIG), dan material dark glass yang menyatu mulus di latar hitam reader."}
          </p>
        </div>
      </div>
    </div>
  );
}
