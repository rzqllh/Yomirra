"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, CaretLeft, CaretRight, Info } from "@phosphor-icons/react";
import { motionEase, motionDuration } from "@/shared/lib/motion/tokens";
import { cn } from "@/shared/utils/cn";

const DUMMY_MANGAS = [
  {
    id: "1",
    title: "Solo Leveling: Ragnarok",
    coverUrl: "https://uploads.mangadex.org/covers/9716e256-11f8-4033-913a-a1db01d0033a/9a19c72e-090c-4fa2-bf5a-4b07fb1b7026.jpg",
    description: "Kisah epik penerus Sung Jin-Woo yang bangkit dari tidur panjangnya untuk menghadapi ancaman dimensi baru yang lebih mengerikan.",
    format: "Manhwa",
    status: "Ongoing",
    latestChapter: "Ch. 142",
  },
  {
    id: "2",
    title: "Oshi no Ko",
    coverUrl: "https://uploads.mangadex.org/covers/296cbc31-af1a-4b5b-a34b-fee2b4cb5385/876c116c-d2c7-43f0-918b-5f10b501d51a.jpg",
    description: "Seorang dokter dan pasiennya terlahir kembali sebagai anak dari idol pujaan mereka, Ai Hoshino. Mengungkap sisi gelap dunia hiburan Jepang.",
    format: "Manga",
    status: "Ongoing",
    latestChapter: "Ch. 153",
  },
  {
    id: "3",
    title: "Omniscient Reader's Viewpoint",
    coverUrl: "https://uploads.mangadex.org/covers/65e9067b-1d70-4f51-8dfb-b67de31fcc05/4ed07d39-e483-42e7-b6f7-b2f3de1eeb25.jpg",
    description: "Kim Dokja mendapati dirinya berada di dalam novel yang ia baca selama 10 tahun terakhir. Satu-satunya orang yang tahu akhir cerita ini.",
    format: "Manhwa",
    status: "Ongoing",
    latestChapter: "Ch. 210",
  }
];

export default function HeroDemoPage() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const current = DUMMY_MANGAS[currentIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % DUMMY_MANGAS.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + DUMMY_MANGAS.length) % DUMMY_MANGAS.length);

  return (
    <div className="min-h-screen bg-surface-base pt-20 pb-10 px-4 sm:px-8 flex flex-col items-center">
      
      <div className="max-w-screen-xl w-full mb-8">
        <h1 className="text-3xl font-black mb-2">Hero V2 Prototype</h1>
        <p className="text-text-muted">Cover-dominant, asymmetric layout, cinematic scale.</p>
      </div>

      {/* Hero Container */}
      <div className="w-full max-w-screen-xl h-[600px] xl:h-[700px] rounded-3xl overflow-hidden relative group bg-black isolate">
        
        {/* Background Image Layer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + "-bg"}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionDuration.slow, ease: motionEase.softOut as [number, number, number, number] }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={current.coverUrl} 
              alt={current.title} 
              className="w-full h-full object-cover opacity-30 blur-2xl scale-125 saturate-200" 
              referrerPolicy="no-referrer"
            />
            {/* Premium Vignette & Blend Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          </motion.div>
        </AnimatePresence>

        {/* Foreground Content */}
        <div className="absolute inset-0 z-10 flex flex-col md:flex-row items-end md:items-center justify-between p-6 sm:p-10 md:p-16 h-full gap-8">
          
          {/* Left Text Block */}
          <div className="flex-1 w-full max-w-xl self-end md:self-center order-2 md:order-1 relative z-20 pb-10 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-text"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wider text-accent uppercase">
                  <span>{current.format}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  <span>{current.latestChapter}</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tighter drop-shadow-lg">
                  {current.title}
                </h2>
                
                <p className="text-white/60 text-sm sm:text-base line-clamp-3 leading-relaxed mt-2 max-w-md font-medium">
                  {current.description}
                </p>

                <div className="flex items-center gap-4 mt-6">
                  <button className="bg-white text-black px-8 py-3.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <Play weight="fill" size={20} />
                    Baca Sekarang
                  </button>
                  <button className="bg-white/5 backdrop-blur-md text-white border border-white/10 p-3.5 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                    <Info weight="bold" size={24} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Image Cover */}
          <div className="w-1/2 md:w-[320px] lg:w-[380px] shrink-0 order-1 md:order-2 self-end md:self-center mr-auto md:mr-0 z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-cover"}
                initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                transition={{ duration: motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
                className="aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              >
                <img 
                  src={current.coverUrl} 
                  alt={current.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-16 z-30 flex items-center gap-3">
          <button 
            onClick={handlePrev}
            className="w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <CaretLeft weight="bold" size={20} />
          </button>
          <div className="flex gap-2 mx-2">
            {DUMMY_MANGAS.map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300", 
                  idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/30"
                )} 
              />
            ))}
          </div>
          <button 
            onClick={handleNext}
            className="w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <CaretRight weight="bold" size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
