import * as React from "react";
import { Star, BookmarkSimple, TrendUp, Play } from "@phosphor-icons/react/dist/ssr";

const MOCK_DATA = [
  { id: 1, title: "Demonic Emperor", chapter: "Chapter 873", rating: "8.2", status: "ONGOING", format: "MANHUA", cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112238-3xQ1994Z2i0x.jpg" },
  { id: 2, title: "Nano Machine", chapter: "Chapter 318", rating: "8.1", status: "ONGOING", format: "MANHWA", cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx120371-LzDcc6vHw3N5.jpg" },
  { id: 3, title: "Eleceed", chapter: "Chapter 407", rating: "8.5", status: "ONGOING", format: "MANHWA", cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105342-0fF2vC7t6c5r.jpg" },
];

export default function PopularDesignLab() {
  return (
    <div className="min-h-screen bg-background text-text-primary p-4 pb-32">
      <div className="max-w-4xl mx-auto space-y-24">
        
        <div className="text-center space-y-4 pt-12">
          <h1 className="text-4xl font-black tracking-tight">Lab Desain Peringkat</h1>
          <p className="text-text-secondary">10 Alternatif UI/UX Premium untuk Peringkat Populer.</p>
        </div>

        {/* 1. Modern Glassmorphism */}
        <section>
          <SectionTitle num={1} title="Modern Glassmorphism" desc="Latar belakang buram dengan border putih yang sangat tipis. Terasa premium di dark mode." />
          <div className="space-y-4 bg-surface-base p-6 rounded-[2rem]">
            {MOCK_DATA.map((manga, i) => (
              <div key={manga.id} className="relative flex items-center gap-4 p-4 rounded-3xl bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl hover:bg-white/10 transition-colors group">
                <div className="relative w-20 h-28 shrink-0 rounded-2xl overflow-hidden">
                  <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-0 left-0 bg-accent/90 backdrop-blur-sm text-white text-xs font-black px-2 py-1 rounded-br-xl">
                    #{i + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-accent/20 text-accent px-2 py-0.5 rounded-full">{manga.status}</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-surface-raised text-text-secondary px-2 py-0.5 rounded-full">{manga.format}</span>
                  </div>
                  <h3 className="font-bold text-lg text-text-primary truncate mb-1 group-hover:text-accent transition-colors">{manga.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-muted font-medium">{manga.chapter}</p>
                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      <Star weight="fill" size={14} /> {manga.rating}
                    </div>
                  </div>
                </div>
                <button className="absolute top-4 right-4 text-text-muted hover:text-accent transition-colors p-2 bg-surface-raised rounded-full">
                  <BookmarkSimple weight="bold" size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Minimalist Editorial */}
        <section>
          <SectionTitle num={2} title="Minimalist Editorial" desc="Tipografi besar, tanpa border, sangat bersih. Mengandalkan white-space." />
          <div className="space-y-6">
            {MOCK_DATA.map((manga, i) => (
              <div key={manga.id} className="group flex items-center gap-6 py-4 border-b border-border-subtle hover:border-accent transition-colors">
                <div className="text-4xl md:text-5xl font-black text-text-muted/30 group-hover:text-accent transition-colors w-12 text-center">
                  {i + 1}
                </div>
                <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-accent transition-all">
                  <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-black text-xl md:text-2xl text-text-primary truncate">{manga.title}</h3>
                  <p className="text-sm text-text-secondary font-medium mt-1">{manga.chapter} • <span className="text-yellow-500 inline-flex items-center gap-1"><Star weight="fill" size={12}/>{manga.rating}</span></p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-accent text-white rounded-full hover:scale-110 active:scale-95">
                  <Play weight="fill" size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Neo-Brutalism */}
        <section>
          <SectionTitle num={3} title="Neo-Brutalism" desc="Desain berani dengan border tebal dan drop shadow solid." />
          <div className="space-y-6 p-6 bg-surface-overlay border-4 border-black dark:border-white rounded-3xl">
            {MOCK_DATA.map((manga, i) => (
              <div key={manga.id} className="flex bg-white dark:bg-black border-4 border-black dark:border-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:-translate-x-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="relative w-24 shrink-0 border-r-4 border-black dark:border-white">
                  <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-accent text-white font-black text-xl px-3 py-1 border-b-4 border-r-4 border-black dark:border-white">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-xl text-black dark:text-white uppercase tracking-tight">{manga.title}</h3>
                    <p className="text-sm font-bold text-black/60 dark:text-white/60">{manga.chapter}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-black bg-yellow-400 text-black px-2 py-1 rounded-sm border-2 border-black">
                      ★ {manga.rating}
                    </span>
                    <button className="bg-black dark:bg-white text-white dark:text-black font-black px-4 py-2 rounded-sm hover:bg-accent hover:text-white transition-colors border-2 border-black dark:border-white">
                      BACA
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Yomirra Accent Glow */}
        <section>
          <SectionTitle num={4} title="Yomirra Accent Glow" desc="Membangun desain yang sudah ada (di screenshot) tapi dengan layout yang lebih premium dan efek glowing." />
          <div className="bg-surface-base border border-border-subtle p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center gap-2 text-accent font-bold tracking-widest uppercase text-sm mb-8 pl-2">
              <TrendUp weight="bold" size={20} /> Peringkat Populer
            </div>
            
            <div className="space-y-4 relative z-10">
              {MOCK_DATA.map((manga, i) => (
                <div key={manga.id} className="group flex items-center p-3 rounded-3xl hover:bg-surface-raised border border-transparent hover:border-border-subtle transition-all cursor-pointer">
                  {/* Rank & Cover Wrapper */}
                  <div className="relative flex items-center">
                    <div className="w-10 text-center font-black text-2xl text-text-muted group-hover:text-accent transition-colors">
                      {i + 1}
                    </div>
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden shadow-md group-hover:shadow-accent/20 transition-all">
                      <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md">{manga.status}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-text-muted bg-surface-overlay px-2 py-0.5 rounded-md">{manga.format}</span>
                    </div>
                    <h4 className="font-bold text-text-primary text-base truncate group-hover:text-accent transition-colors">{manga.title}</h4>
                    <p className="text-xs text-text-secondary mt-0.5 font-medium">{manga.chapter}</p>
                  </div>
                  
                  {/* Rating & Action */}
                  <div className="flex flex-col items-end gap-2 pr-2">
                    <button className="text-text-muted hover:text-accent transition-colors p-1.5 rounded-full hover:bg-accent/10">
                      <BookmarkSimple weight="fill" size={18} />
                    </button>
                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-xs">
                      <Star weight="fill" size={12} /> {manga.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Bento Grid List */}
        <section>
          <SectionTitle num={5} title="Bento List" desc="Pemisahan informasi dalam sel-sel (grid/bento) untuk struktur data yang sangat rapi." />
          <div className="space-y-3">
            {MOCK_DATA.map((manga, i) => (
              <div key={manga.id} className="flex gap-2 h-24">
                <div className="w-12 bg-surface-raised rounded-2xl flex items-center justify-center font-black text-xl text-text-muted border border-border-subtle">
                  {i + 1}
                </div>
                <div className="w-20 rounded-2xl overflow-hidden border border-border-subtle relative">
                  <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover absolute inset-0" />
                </div>
                <div className="flex-1 bg-surface-raised rounded-2xl border border-border-subtle p-3 flex flex-col justify-center min-w-0 hover:bg-surface-overlay transition-colors cursor-pointer">
                  <h3 className="font-bold text-text-primary truncate">{manga.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{manga.chapter}</p>
                </div>
                <div className="w-20 bg-surface-raised rounded-2xl border border-border-subtle flex flex-col items-center justify-center text-yellow-500 font-bold">
                  <Star weight="fill" size={16} className="mb-1" />
                  <span className="text-sm">{manga.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Cinematic Widescreen */}
        <section>
          <SectionTitle num={6} title="Cinematic Widescreen" desc="Cover image dijadikan background baris secara penuh dengan overlay gradient hitam pekat." />
          <div className="space-y-4">
            {MOCK_DATA.map((manga, i) => (
              <div key={manga.id} className="relative h-28 rounded-3xl overflow-hidden group cursor-pointer shadow-lg">
                <img src={manga.cover} alt={manga.title} className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                
                <div className="absolute inset-0 p-5 flex items-center">
                  <div className="w-12 text-3xl font-black text-white/50 group-hover:text-white transition-colors drop-shadow-md">
                    {i + 1}
                  </div>
                  <div className="flex-1 pr-4">
                    <h3 className="font-black text-xl text-white drop-shadow-lg mb-1 line-clamp-1 group-hover:text-accent-hover transition-colors">{manga.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/80">{manga.chapter}</span>
                      <span className="text-xs font-bold text-yellow-400 flex items-center gap-1"><Star weight="fill" size={12}/> {manga.rating}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-accent text-white p-3 rounded-full mr-4 shadow-xl">
                    <Play weight="fill" size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. The Yomirra "Card" Remaster (Solving the overlapping black dot) */}
        <section>
          <SectionTitle num={7} title="Card Remastered" desc="Memperbaiki desain asli di screenshot, menghapus dot hitam aneh, dan membuat komposisi lebih seimbang." />
          <div className="bg-surface-base p-6 rounded-[2rem] border border-border-subtle">
            <div className="flex items-center gap-2 text-text-primary font-black uppercase text-sm mb-6">
              <TrendUp weight="bold" size={18} className="text-accent" /> Peringkat Populer
            </div>
            <div className="space-y-4">
              {MOCK_DATA.map((manga, i) => (
                <div key={manga.id} className="flex bg-surface-raised rounded-[1.5rem] overflow-hidden hover:bg-surface-overlay transition-colors border border-transparent hover:border-border-subtle group">
                  <div className="relative w-[90px] shrink-0">
                    <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" />
                    {/* Number Badge (Moved inside image nicely) */}
                    <div className="absolute top-0 left-0 bg-black/80 backdrop-blur-md text-white font-black text-xs w-7 h-7 flex items-center justify-center rounded-br-xl">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-full">{manga.status}</span>
                        <span className="text-[10px] font-black uppercase text-text-secondary bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{manga.format}</span>
                      </div>
                      <button className="text-text-muted hover:text-accent transition-colors">
                        <BookmarkSimple weight="bold" size={18} />
                      </button>
                    </div>
                    <h4 className="font-bold text-text-primary mb-1">{manga.title}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-text-secondary font-medium">{manga.chapter}</span>
                      <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><Star weight="fill" size={12}/> {manga.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function SectionTitle({ num, title, desc }: { num: number, title: string, desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-black flex items-center gap-3">
        <span className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{num}</span>
        {title}
      </h2>
      <p className="text-text-secondary mt-2 pl-11">{desc}</p>
    </div>
  );
}
