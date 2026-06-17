"use client";

import * as React from "react";
import { Play, CaretRight, Clock, BookOpen, Fire, TrendUp, Compass, BookmarkSimple } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { motion } from "motion/react";

// DUMMY DATA
const historyData = [
  { id: 1, title: "Revenge Of The Iron-Blooded Sword Hound", chapter: "Chapter 12", coverUrl: "https://picsum.photos/seed/manga1/400/600", lastRead: "2 jam yang lalu", progress: 65 },
  { id: 2, title: "Solo Max-Level Newbie", chapter: "Chapter 145", coverUrl: "https://picsum.photos/seed/manga2/400/600", lastRead: "Kemarin", progress: 100 },
  { id: 3, title: "Omniscient Reader's Viewpoint", chapter: "Chapter 200", coverUrl: "https://picsum.photos/seed/manga3/400/600", lastRead: "2 hari yang lalu", progress: 12 },
  { id: 4, title: "Swordmaster's Youngest Son", chapter: "Chapter 89", coverUrl: "https://picsum.photos/seed/manga4/400/600", lastRead: "Minggu lalu", progress: 98 },
  { id: 5, title: "The Greatest Estate Developer", chapter: "Chapter 104", coverUrl: "https://picsum.photos/seed/manga5/400/600", lastRead: "2 minggu yang lalu", progress: 40 },
];

const trendingData = [
  { id: 1, title: "Pick Me Up, Infinite Gacha", score: 9.8, rank: 1, coverUrl: "https://picsum.photos/seed/trend1/400/600" },
  { id: 2, title: "The Villain Of Destiny", score: 9.7, rank: 2, coverUrl: "https://picsum.photos/seed/trend2/400/600" },
  { id: 3, title: "Mercenary Enrollment", score: 9.6, rank: 3, coverUrl: "https://picsum.photos/seed/trend3/400/600" },
  { id: 4, title: "Return of the Mount Hua Sect", score: 9.5, rank: 4, coverUrl: "https://picsum.photos/seed/trend4/400/600" },
  { id: 5, title: "Nano Machine", score: 9.4, rank: 5, coverUrl: "https://picsum.photos/seed/trend5/400/600" },
];

export default function DesignDemoPage() {
  return (
    <div className="min-h-screen pb-40 pt-24 space-y-32">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-hover mb-2">Design Alternatives Showcase</h1>
        <p className="text-text-muted mb-12">HuaShu Design Pro Max Prototype</p>

        {/* SECTION: CONTINUE READING (RAK BUKU) */}
        <section className="space-y-24">
          <div className="border-b border-border-subtle pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3"><BookOpen weight="duotone" className="text-accent" /> Desain Rak Buku (Riwayat Sedang Dibaca)</h2>
            <p className="text-text-muted mt-2">Pilih salah satu opsi layout untuk menggantikan desain Rak Buku saat ini.</p>
          </div>

          {/* Option A: Netflix-style Resume Row (Wide Card) */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Opsi A: Netflix-style Resume Row (Rekomendasi)</h3>
            <p className="text-text-muted text-sm">Setiap komik berbentuk wide card dengan tombol Play besar dan progress bar di bawah sampul. Cocok untuk fokus melanjutkan bacaan.</p>
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
              {historyData.map((item) => (
                <div key={item.id} className="relative flex-none w-full md:w-[320px] bg-surface-raised rounded-2xl overflow-hidden border border-border-subtle group snap-start shadow-sm hover:shadow-md hover:border-border-default transition-all">
                  <div className="flex p-4 gap-4">
                    <div className="w-[80px] shrink-0 aspect-[2/3] rounded-lg overflow-hidden shadow-sm">
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                      <h4 className="font-bold text-sm line-clamp-2 text-text-primary group-hover:text-accent transition-colors">{item.title}</h4>
                      <p className="text-xs font-medium text-text-muted mt-1">{item.chapter}</p>
                      <p className="text-[10px] text-text-muted/60 mt-0.5">{item.lastRead}</p>
                      
                      <div className="mt-auto pt-3">
                        <button className="bg-surface-overlay border border-border-default hover:bg-surface-hover text-text-primary rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors">
                          <Play weight="fill" /> Lanjut
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-surface-muted w-full">
                    <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Option B: Timeline List */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Opsi B: Timeline List (Jurnal Membaca)</h3>
            <p className="text-text-muted text-sm">Daftar vertikal memanjang ke bawah. Tampilan bersih dan rapi seperti riwayat aktivitas.</p>
            <div className="bg-surface-raised rounded-3xl p-2 sm:p-6 border border-border-subtle max-w-2xl">
              <div className="space-y-1">
                {historyData.map((item, idx) => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border-subtle">
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-sm line-clamp-1 group-hover:text-accent transition-colors">{item.title}</h4>
                        <span className="text-[10px] text-text-muted whitespace-nowrap">{item.lastRead}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-text-muted">{item.chapter}</span>
                        <span className="text-text-muted/30 text-xs">•</span>
                        <span className="text-xs font-medium text-accent">{item.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center pl-2">
                      <CaretRight weight="bold" className="text-text-muted group-hover:text-text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Option C: Cover Grid dengan Indikator */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Opsi C: Cover Grid dengan Indikator Overlay</h3>
            <p className="text-text-muted text-sm">Format grid seragam dengan bagian Eksplorasi, tetapi ditambahkan overlay chapter dan progress bar tipis.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {historyData.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 group cursor-pointer">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border-subtle shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-accent text-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play size={24} weight="fill" />
                      </div>
                    </div>
                    
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      Lanjut {item.chapter}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <h4 className="font-bold text-sm line-clamp-2 group-hover:text-accent transition-colors leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-text-muted mt-1.5">{item.lastRead}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* SECTION: 10 EKSPLORASI CARD DESIGN ALTERNATIVES */}
        <section className="space-y-16 mt-32">
          <div className="border-b border-border-subtle pb-4">
            <h2 className="text-3xl font-bold flex items-center gap-3"><Compass weight="duotone" className="text-accent" /> 10 Alternatif Desain Kartu Eksplorasi</h2>
            <p className="text-text-muted mt-2">Pilih gaya visual yang paling cocok untuk Yomirra. Arahkan kursor (hover) untuk melihat interaksi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
            
            {/* 1. Minimalist Glass */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">1. Minimalist Glass</h3>
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-surface-raised">
                <img src={trendingData[0].coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-2 right-2 bg-surface-glass backdrop-blur-md px-2 py-1 rounded border border-border-glass opacity-0 group-hover:opacity-100 transition-opacity">
                  <BookmarkSimple weight="bold" size={14} className="text-text-primary" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm line-clamp-1">{trendingData[0].title}</h4>
                <p className="text-xs text-text-muted">Manga • Ch. 120</p>
              </div>
            </div>

            {/* 2. Floating Title */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">2. Floating Title</h3>
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <img src={trendingData[1].coverUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 w-full p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                  <h4 className="font-bold text-white text-base line-clamp-2 drop-shadow-md">{trendingData[1].title}</h4>
                </div>
              </div>
            </div>

            {/* 3. Holographic Hover */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">3. Holographic</h3>
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden group cursor-pointer bg-slate-900 border border-white/10 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:animate-[shimmer_1.5s_infinite] before:z-10">
                <img src={trendingData[2].coverUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <h4 className="font-bold text-white text-xs line-clamp-1 text-center">{trendingData[2].title}</h4>
                </div>
              </div>
            </div>

            {/* 4. Tachiyomi Classic */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">4. Classic App</h3>
              <div className="relative aspect-[2/3] rounded-md overflow-hidden group cursor-pointer bg-surface-raised">
                <img src={trendingData[3].coverUrl} className="w-full h-full object-cover" />
                <div className="absolute top-0 left-0 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md">UPDATE</div>
                <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1.5">
                  <h4 className="font-semibold text-white text-[11px] line-clamp-2 leading-tight">{trendingData[3].title}</h4>
                </div>
              </div>
            </div>

            {/* 5. Webtoon Style */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">5. Webtoon Style</h3>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group cursor-pointer shadow-md">
                <img src={trendingData[4].coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-semantic-success text-white text-xs font-black px-2 py-1 rounded-full shadow-md uppercase">UP</div>
              </div>
              <div className="px-1">
                <h4 className="font-black text-base line-clamp-1">{trendingData[4].title}</h4>
                <p className="text-sm text-accent font-semibold">Action, Fantasy</p>
              </div>
            </div>

            {/* 6. Polaroid Stack */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">6. Polaroid</h3>
              <div className="bg-white p-2.5 pb-8 rounded-sm shadow-md group cursor-pointer hover:-rotate-2 hover:scale-105 hover:shadow-xl transition-all duration-300 aspect-[2/3] flex flex-col">
                <div className="w-full h-full bg-slate-200 overflow-hidden relative">
                  <img src={trendingData[0].coverUrl} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
                </div>
                <h4 className="font-handwriting text-slate-800 text-center font-bold text-sm mt-3 line-clamp-1">{trendingData[0].title}</h4>
              </div>
            </div>

            {/* 7. Cyberpunk Neon */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">7. Cyberpunk</h3>
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden group cursor-pointer border border-transparent hover:border-accent hover:shadow-[0_0_15px_rgba(var(--color-accent),0.5)] transition-all duration-300">
                <img src={trendingData[1].coverUrl} className="w-full h-full object-cover contrast-125" />
                <div className="absolute -right-8 top-4 bg-accent text-slate-900 text-[10px] font-black px-8 py-0.5 rotate-45 shadow-lg">NEW</div>
                <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 border-t border-accent p-2 backdrop-blur-sm">
                  <h4 className="font-mono font-bold text-accent text-xs line-clamp-1">{trendingData[1].title}</h4>
                </div>
              </div>
            </div>

            {/* 8. Editorial Magazine */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">8. Editorial</h3>
              <div className="relative aspect-[2/3] group cursor-pointer border-b-2 border-transparent hover:border-text-primary transition-colors pb-2">
                <div className="w-full h-full overflow-hidden mb-3">
                  <img src={trendingData[2].coverUrl} className="w-full h-full object-cover sepia-[20%] group-hover:sepia-0 transition-all duration-500" />
                </div>
                <h4 className="font-serif font-bold text-lg leading-tight line-clamp-2 text-text-primary">{trendingData[2].title}</h4>
                <p className="font-serif text-xs text-text-muted italic mt-1">Vol. 12</p>
              </div>
            </div>

            {/* 9. Gacha Card (SSR) */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">9. Gacha SSR</h3>
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden group cursor-pointer border-2 border-amber-300/50 hover:border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-500">
                <img src={trendingData[3].coverUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-purple-500/20 mix-blend-overlay" />
                <div className="absolute top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-0 group-hover:opacity-40 transition-opacity duration-700 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-amber-950/90 to-transparent p-3 pt-8">
                  <div className="flex gap-0.5 mb-1 text-amber-400 text-xs">★★★★★</div>
                  <h4 className="font-bold text-white text-sm line-clamp-1 drop-shadow-md">{trendingData[3].title}</h4>
                </div>
              </div>
            </div>

            {/* 10. Neumorphism */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">10. Neumorphism</h3>
              <div className="relative aspect-[2/3] rounded-3xl p-2 group cursor-pointer bg-surface-base shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.05)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] transition-all duration-300">
                <div className="w-full h-full rounded-2xl overflow-hidden">
                  <img src={trendingData[4].coverUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="text-center mt-2">
                <h4 className="font-bold text-sm text-text-secondary group-hover:text-text-primary transition-colors line-clamp-1">{trendingData[4].title}</h4>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* Option 5: Floating Dock (Fixed position) */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="hidden lg:flex relative bg-surface-glass backdrop-blur-xl border border-border-glass shadow-glass rounded-full p-2 items-center gap-4 group cursor-pointer hover:bg-surface-overlay/80 transition-all hover:scale-105">
          <div className="absolute -top-10 right-0 text-xs font-bold text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
            5. Floating Dock (Demo)
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border-subtle shrink-0">
             <img src={historyData[0].coverUrl} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Lanjut Baca</span>
            <span className="text-xs font-semibold text-text-primary line-clamp-1 w-[120px]">{historyData[0].title}</span>
          </div>
          <button className="size-8 rounded-full bg-accent text-white flex items-center justify-center shrink-0 mr-1 shadow-md">
            <Play weight="fill" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
