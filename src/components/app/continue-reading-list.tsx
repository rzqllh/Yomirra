"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, BookBookmark, MagnifyingGlass, Compass } from "@phosphor-icons/react";
import { HistoryItem } from "@/shared/store/history-store";
import { getReaderHref } from "@/shared/lib/routes";

interface ContinueReadingListProps {
  items: HistoryItem[];
}

export function ContinueReadingList({ items }: ContinueReadingListProps) {
  const router = useRouter();

  if (!items || items.length === 0) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-surface-raised/40 to-surface-base/20 border border-white/5 backdrop-blur-xl p-12 flex flex-col items-center justify-center text-center shadow-2xl">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-surface-raised to-surface-overlay border border-white/10 flex items-center justify-center text-accent drop-shadow-xl rotate-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
             <BookBookmark size={36} weight="duotone" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-surface-raised/80 border border-white/5 flex items-center justify-center text-text-muted/50 -rotate-6 backdrop-blur-md -z-10">
             <Compass size={24} weight="duotone" />
          </div>
        </div>

        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-3 tracking-tight">Belum ada perjalanan</h3>
        <p className="text-text-muted max-w-md mb-8 leading-relaxed">
          Katalog berisi ribuan cerita menunggumu. Mulai baca komik pertamamu sekarang dan riwayat akan tercatat di sini.
        </p>
        
        <Link 
          href="/search"
          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 flex items-center gap-2"
        >
          Eksplorasi Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
      {items.map((item, index) => (
        <div 
          key={item.mangaId} 
          className="w-[320px] md:w-[380px] flex-shrink-0 snap-start relative flex flex-col justify-center p-6 rounded-[32px] overflow-hidden group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.3)] transition-all duration-300"
          style={{ minHeight: '180px' }}
        >
          {/* Top Gradient Hue to mimic the screenshot's soft purple top */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-fuchsia-100/60 via-indigo-50/40 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 pointer-events-none" />
          
          <div className="relative z-10 w-full flex gap-5 items-center">
             {/* Thumbnail */}
             <div className="w-[84px] h-[116px] sm:w-[90px] sm:h-[124px] rounded-[20px] overflow-hidden shrink-0 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] relative bg-white dark:bg-slate-800">
               <BookBookmark className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 z-0" size={28} weight="duotone" />
               <img 
                 src={item.coverUrl || ""} 
                 className="w-full h-full object-cover relative z-10 text-[0px]" 
                 alt={item.mangaTitle} 
                 loading="lazy" 
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
             </div>

             {/* Content */}
             <div className="flex-1 min-w-0 flex flex-col justify-center">
               <div className="inline-flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/5 w-max">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                 <span className="text-indigo-600 dark:text-indigo-300 font-extrabold tracking-wide text-[9px] uppercase">
                   Lanjut Baca
                 </span>
               </div>
               
               <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-tight mb-1 line-clamp-1">{item.mangaTitle}</h2>
               <p className="text-slate-400 dark:text-slate-400 text-sm mb-4 truncate font-medium">{item.chapterTitle || `Chapter ${item.chapterId}`}</p>
               
               <div className="flex items-center gap-4 mt-2">
                 <Link 
                   href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}
                   className="bg-indigo-500 text-white hover:bg-indigo-600 w-[38px] h-[38px] rounded-full transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)] active:scale-95 shrink-0 group/play"
                 >
                   <Play weight="fill" size={16} className="ml-0.5 group-hover/play:scale-110 transition-transform" />
                 </Link>
                 
                 {(item.seriesProgressPercent !== undefined || item.progressPercent !== undefined) && (
                    <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                      <div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" style={{ width: `${item.seriesProgressPercent ?? item.progressPercent}%` }} />
                    </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      ))}

      {/* Idea 5: Inline Search Card Filler */}
      {items.length < 3 && (
        <div 
          className="w-[310px] md:w-[380px] flex-shrink-0 snap-start relative flex flex-col justify-center p-6 sm:p-8 rounded-3xl overflow-hidden shadow-lg group bg-gradient-to-br from-indigo-500 to-purple-600 text-white border border-white/10"
          style={{ minHeight: '220px' }}
        >
          {/* Decorative shapes */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-900/30 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 border border-white/10 shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform">
              <MagnifyingGlass className="w-6 h-6 text-white" weight="bold" />
            </div>
            <h3 className="text-xl font-bold mb-2">Mau baca apa hari ini?</h3>
            <p className="text-white/80 text-sm mb-5 leading-relaxed">Cari ribuan komik dan lanjutkan petualanganmu.</p>
            
            <form 
              className="relative" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const q = new FormData(e.currentTarget).get("q"); 
                if (q) router.push(`/search?q=${q}`); 
              }}
            >
               <input 
                 name="q" 
                 type="text" 
                 placeholder="Ketik judul komik..." 
                 className="w-full bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-full pl-5 pr-12 py-3 text-sm outline-none focus:bg-white/20 focus:border-white/40 transition-all shadow-inner" 
                 required
               />
               <button 
                 type="submit" 
                 className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-white text-indigo-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
               >
                 <MagnifyingGlass weight="bold" className="w-4 h-4" />
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
