"use client";

import * as React from "react";
import Link from "next/link";
import { Play, ArrowRight, ClockCounterClockwise, Star } from "@phosphor-icons/react";
import { HistoryItem } from "@/shared/store/history-store";
import { getReaderHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import { motion } from "motion/react";

interface DemoProps {
  items: HistoryItem[];
}

export function HomeHeroDemo({ items }: DemoProps) {
  const [activeTab, setActiveTab] = React.useState<"bento" | "carousel" | "split">("bento");

  if (items.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      <div className="flex gap-2 p-1 bg-surface-raised rounded-full w-fit mx-auto border border-border-glass">
        {(["bento", "carousel", "split"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold capitalize transition-all",
              activeTab === tab ? "bg-accent text-white shadow-md" : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="w-full relative">
        {activeTab === "bento" && <BentoHero items={items} />}
        {activeTab === "carousel" && <CarouselHero items={items} />}
        {activeTab === "split" && <SplitDashboardHero items={items} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// OPTION 1: BENTO GRID
// ---------------------------------------------------------
function BentoHero({ items }: { items: HistoryItem[] }) {
  const primary = items[0];
  const secondary = items[1];
  const tertiary = items[2];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[400px]">
      {/* Main Block (2/3 width) */}
      <div className="md:col-span-2 relative rounded-3xl overflow-hidden group border border-border-glass bg-surface-raised h-[300px] md:h-full">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${primary?.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-accent/20">
              Lanjut Baca
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-1 line-clamp-2">{primary?.mangaTitle}</h2>
          <p className="text-text-muted font-medium mb-6">{primary?.chapterTitle || `Chapter ${primary?.chapterId}`}</p>
          
          <Link 
            href={getReaderHref(primary?.sourceId || "", primary?.mangaId || "", primary?.chapterId || "")}
            className="bg-white text-black px-6 py-3 rounded-full font-bold w-fit hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            <Play weight="fill" /> Resume
          </Link>
        </div>
      </div>

      {/* Side Blocks (1/3 width stacked) */}
      <div className="flex flex-col gap-4 h-[300px] md:h-full">
        {/* Top Side Block: Secondary Manga */}
        {secondary ? (
          <Link 
            href={getReaderHref(secondary.sourceId, secondary.mangaId, secondary.chapterId)}
            className="flex-1 relative rounded-3xl overflow-hidden group border border-border-glass bg-surface-raised flex items-end p-5"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${secondary.coverUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="relative z-10 w-full">
              <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><ClockCounterClockwise weight="bold"/> Riwayat</p>
              <h3 className="font-bold text-white line-clamp-1">{secondary.mangaTitle}</h3>
            </div>
          </Link>
        ) : (
          <div className="flex-1 rounded-3xl border border-border-glass bg-surface-raised flex items-center justify-center p-5">
             <span className="text-text-muted text-sm">Kosong</span>
          </div>
        )}

        {/* Bottom Side Block: Stats/Tertiary */}
        <div className="flex-1 rounded-3xl border border-border-glass bg-surface-glass backdrop-blur-md flex flex-col justify-center p-6">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Statistik</h3>
          <div className="text-3xl font-black text-white flex items-baseline gap-2">
            {items.length} <span className="text-sm font-medium text-text-muted">Komik</span>
          </div>
          <p className="text-xs text-text-muted mt-1">Tersimpan di Riwayat</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// OPTION 2: CAROUSEL / COVERFLOW
// ---------------------------------------------------------
function CarouselHero({ items }: { items: HistoryItem[] }) {
  // A simple side-scrolling snap carousel with scaling effects
  return (
    <div className="w-full h-[400px] flex flex-col justify-center overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 z-10 pointer-events-none">
        <span className="bg-surface-glass text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-border-glass">
          Geser untuk melihat (Coverflow)
        </span>
      </div>
      
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 px-[10%] md:px-[30%] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        {items.slice(0, 5).map((item, i) => (
          <div key={i} className="snap-center shrink-0 w-[240px] md:w-[280px] group relative">
            <Link href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}>
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-[1.02] border border-border-glass/50 bg-surface-raised">
                <img src={item.coverUrl || ""} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 flex flex-col justify-end p-5">
                  <div className="bg-accent text-white w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                    <Play weight="fill" />
                  </div>
                  <h3 className="font-black text-white text-lg line-clamp-2 leading-tight mb-1">{item.mangaTitle}</h3>
                  <p className="text-text-muted text-sm">{item.chapterTitle || `Chapter ${item.chapterId}`}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// OPTION 3: SPLIT DASHBOARD
// ---------------------------------------------------------
function SplitDashboardHero({ items }: { items: HistoryItem[] }) {
  const primary = items[0];
  const rest = items.slice(1, 4);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[380px]">
      {/* Left: Compact Resume Banner */}
      <div className="flex-1 relative rounded-3xl overflow-hidden border border-border-glass bg-surface-raised flex flex-col justify-end p-8 group h-[300px] md:h-full">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen transition-transform duration-1000 group-hover:scale-110"
          style={{ backgroundImage: `url(${primary?.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-transparent" />
        
        <div className="relative z-10 max-w-sm">
          <span className="text-accent font-bold tracking-widest text-xs uppercase mb-3 block">Sedang Dibaca</span>
          <h2 className="text-3xl font-black text-white leading-tight mb-2 line-clamp-2">{primary?.mangaTitle}</h2>
          <p className="text-text-muted mb-8">{primary?.chapterTitle}</p>
          
          <Link 
            href={getReaderHref(primary?.sourceId || "", primary?.mangaId || "", primary?.chapterId || "")}
            className="bg-accent text-white px-6 py-3 rounded-full font-bold w-fit hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <Play weight="fill" /> Lanjut Baca
          </Link>
        </div>
      </div>

      {/* Right: Compact Feed List */}
      <div className="w-full md:w-[320px] lg:w-[400px] rounded-3xl border border-border-glass bg-surface-glass backdrop-blur-md p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white">Riwayat Lainnya</h3>
          <Link href="/bookmark" className="text-accent text-sm hover:underline">Lihat Semua</Link>
        </div>
        
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {rest.map((item, i) => (
            <Link 
              key={i}
              href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}
              className="flex gap-4 items-center group"
            >
              <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-raised border border-border-glass">
                <img src={item.coverUrl || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-accent transition-colors">{item.mangaTitle}</h4>
                <p className="text-xs text-text-muted mt-1">{item.chapterTitle}</p>
                <div className="w-full h-1 bg-surface-raised rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${item.progressPercent || 0}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
