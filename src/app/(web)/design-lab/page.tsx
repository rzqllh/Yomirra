import * as React from "react";
import { Play } from "@phosphor-icons/react/dist/ssr";

const MOCK_DATA = {
  title: "When a Genius Office Worker Goes Too Far",
  chapter: "Chapter 48",
  status: "ONGOING",
  format: "Manhwa",
  synopsis: "Ikuti kisah serunya dengan membaca chapter terbaru sekarang juga. Seorang pekerja kantoran biasa yang jenius tiba-tiba menembus batas kewajaran dan mengubah dunia di sekitarnya.",
  coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx148926-2E1NpwRXYqE3.jpg"
};

export default function DesignLabPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4 flex flex-col gap-32 font-sans overflow-x-hidden">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-black mb-4">UI/UX Pro Max: Card Design Lab</h1>
        <p className="text-text-muted">10 alternatif desain untuk Featured Hero Carousel. Semuanya fully responsive dengan Tailwind v4.</p>
      </div>

      {/* 1. The Immersive Cinematic */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">1. The Immersive Cinematic</h2>
        <div className="relative w-full h-[500px] rounded-[2rem] overflow-hidden group">
          {/* Background Blur */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-20 blur-xl scale-110"
            style={{ backgroundImage: `url(${MOCK_DATA.coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          
          <div className="absolute inset-0 p-8 md:p-16 flex flex-col md:flex-row items-center md:items-end gap-8 z-10">
            <div className="w-[160px] md:w-[220px] shrink-0 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:-translate-y-4 transition-transform duration-500">
              <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover" alt="Cover" />
            </div>
            <div className="flex-1 text-center md:text-left mb-4 md:mb-8">
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">Sorotan Utama</span>
              <h3 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">{MOCK_DATA.title}</h3>
              <p className="text-white/70 font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
                <span className="text-white">{MOCK_DATA.chapter}</span> • <span>{MOCK_DATA.status}</span> • <span>{MOCK_DATA.format}</span>
              </p>
              <button className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto md:mx-0 hover:bg-gray-200 transition-colors">
                <Play weight="fill" /> Mulai Membaca
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Minimalist Editorial */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">2. The Minimalist Editorial (Apple-esque)</h2>
        <div className="w-full rounded-[2rem] bg-surface-raised border border-border-subtle p-8 md:p-16 flex flex-col md:flex-row-reverse items-center justify-between gap-12 group">
          <div className="w-[180px] md:w-[240px] shrink-0 aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-transform duration-700 group-hover:scale-105">
            <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          </div>
          <div className="flex-1 max-w-xl text-center md:text-left">
            <h3 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight mb-6 text-text-primary">
              {MOCK_DATA.title}
            </h3>
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              {MOCK_DATA.synopsis}
            </p>
            <div className="flex items-center gap-6 justify-center md:justify-start">
              <button className="bg-text-primary text-background px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                <Play weight="fill" /> Baca {MOCK_DATA.chapter}
              </button>
              <div className="text-sm font-medium text-text-muted">
                {MOCK_DATA.format} • {MOCK_DATA.status}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Glassmorphic Bento */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">3. The Glassmorphic Bento</h2>
        <div className="w-full relative rounded-[2.5rem] p-4 md:p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-border-subtle backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 bg-surface/50 dark:bg-surface-raised/50 rounded-[2rem] p-8 md:p-12 flex flex-col justify-center border border-border-subtle">
              <span className="text-purple-500 font-bold uppercase tracking-wider text-sm mb-4">Trending #1</span>
              <h3 className="text-3xl md:text-5xl font-black mb-4">{MOCK_DATA.title}</h3>
              <p className="text-text-secondary mb-8 line-clamp-2">{MOCK_DATA.synopsis}</p>
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold w-fit flex items-center gap-2 shadow-lg shadow-purple-500/25">
                <Play weight="fill" /> Mulai Membaca
              </button>
            </div>
            <div className="md:col-span-1 relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-border-subtle group">
              <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <div className="text-white">
                  <div className="font-bold">{MOCK_DATA.chapter}</div>
                  <div className="text-sm text-white/70">{MOCK_DATA.status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Magazine Spread */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">4. The Magazine Spread (Serif)</h2>
        <div className="w-full flex flex-col md:flex-row bg-surface-raised overflow-hidden rounded-[2rem] border border-border-subtle">
          <div className="w-full md:w-1/2 aspect-square md:aspect-auto">
            <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Cover" />
          </div>
          <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
            <h3 className="text-4xl md:text-5xl font-serif italic font-medium mb-6 text-text-primary leading-snug">
              "{MOCK_DATA.title}"
            </h3>
            <p className="text-text-secondary mb-10 leading-relaxed font-serif text-lg">
              <span className="text-4xl float-left mr-2 font-black text-accent leading-none">I</span>{MOCK_DATA.synopsis.substring(1)}
            </p>
            <div className="flex justify-between items-center border-t border-border-subtle pt-6">
              <span className="font-bold uppercase tracking-widest text-sm">{MOCK_DATA.format}</span>
              <button className="border border-text-primary text-text-primary px-6 py-2 rounded-full hover:bg-text-primary hover:text-background transition-colors uppercase text-xs font-bold tracking-widest">
                Read {MOCK_DATA.chapter}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Neobrutalist */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">5. The Neobrutalist (High Contrast)</h2>
        <div className="w-full bg-[#f0f0f0] dark:bg-[#111] p-8 md:p-12 border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] flex flex-col md:flex-row gap-8 items-center">
          <div className="w-[200px] shrink-0 border-4 border-black dark:border-white">
            <img src={MOCK_DATA.coverUrl} className="w-full h-auto" alt="Cover" />
          </div>
          <div className="flex-1">
            <div className="inline-block bg-yellow-400 text-black border-2 border-black font-black uppercase px-4 py-1 mb-4 transform -rotate-2">
              Hot Release!
            </div>
            <h3 className="text-5xl md:text-7xl font-black uppercase leading-none mb-6 text-black dark:text-white stroke-text">
              {MOCK_DATA.title}
            </h3>
            <div className="flex gap-4">
              <button className="bg-blue-500 text-white font-black text-xl px-8 py-4 border-4 border-black dark:border-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all">
                READ NOW
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. The Dark Tech / Hacker */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">6. The Dark Tech (Cyber UI)</h2>
        <div className="w-full bg-[#050505] p-1 border border-green-500/30 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="bg-black p-8 md:p-12 rounded-md flex flex-col md:flex-row gap-10 items-center relative z-10 border border-white/5">
            <div className="w-[180px] aspect-[3/4] relative">
              <div className="absolute -inset-1 bg-green-500/20 blur-md group-hover:bg-green-500/40 transition-colors" />
              <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover relative z-10 grayscale contrast-125" alt="Cover" />
              {/* Scanline effect */}
              <div className="absolute inset-0 z-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
            </div>
            <div className="flex-1 font-mono text-green-500">
              <div className="text-xs mb-2 opacity-50">{"// SYS.INIT // ID: YOMIRRA_CORE"}</div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight text-white uppercase">{MOCK_DATA.title}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="opacity-50">STATUS:</span> {MOCK_DATA.status}</div>
                <div><span className="opacity-50">FORMAT:</span> {MOCK_DATA.format}</div>
                <div><span className="opacity-50">CH:</span> {MOCK_DATA.chapter}</div>
              </div>
              <button className="w-full border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-bold py-3 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                <Play weight="fill" /> Execute Read
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. The Soft Pastel Bubble */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">7. The Soft Pastel Bubble (Friendly)</h2>
        <div className="w-full bg-gradient-to-tr from-pink-100 to-orange-100 dark:from-pink-950 dark:to-orange-950 rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center">
          <div className="w-[160px] aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-xl mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white/50 dark:border-white/10">
            <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          </div>
          <h3 className="text-4xl font-black text-pink-900 dark:text-pink-100 mb-4">{MOCK_DATA.title}</h3>
          <p className="text-pink-800/70 dark:text-pink-200/70 font-medium mb-8 max-w-lg">
            {MOCK_DATA.synopsis}
          </p>
          <button className="bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 text-pink-900 dark:text-pink-100 px-8 py-4 rounded-[2rem] font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-2">
            <Play weight="fill" /> Mulai Membaca {MOCK_DATA.chapter}
          </button>
        </div>
      </section>

      {/* 8. The Text Overlay (Dynamic) */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">8. The Typographic Overlap</h2>
        <div className="w-full relative h-[450px] bg-surface-raised rounded-[2rem] overflow-hidden flex items-center justify-end pr-10 md:pr-20 group">
          <div className="absolute left-10 md:left-20 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <h3 className="text-5xl md:text-8xl font-black leading-none text-text-primary mix-blend-difference opacity-90 max-w-[800px] uppercase">
              {MOCK_DATA.title}
            </h3>
          </div>
          <div className="w-[240px] md:w-[320px] aspect-[3/4] relative z-10 transform translate-x-10 group-hover:-translate-x-10 transition-transform duration-1000 ease-in-out">
            <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover rounded-xl shadow-2xl" alt="Cover" />
          </div>
          <div className="absolute bottom-10 left-10 md:left-20 z-30">
            <button className="bg-accent text-white px-6 py-3 rounded-full font-bold flex items-center gap-2">
               <Play weight="fill" /> {MOCK_DATA.chapter}
            </button>
          </div>
        </div>
      </section>

      {/* 9. The Widescreen Landscape */}
      <section className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-accent">9. The Widescreen Landscape (Banner)</h2>
        <div className="w-full h-[300px] md:h-[400px] relative rounded-3xl overflow-hidden group">
          {/* We fake a landscape crop using object-position */}
          <img src={MOCK_DATA.coverUrl} className="absolute inset-0 w-full h-full object-cover object-[50%_25%] group-hover:scale-105 transition-transform duration-1000" alt="Cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center max-w-2xl text-white">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">{MOCK_DATA.title}</h3>
            <p className="text-white/80 line-clamp-2 mb-8">{MOCK_DATA.synopsis}</p>
            <button className="bg-white text-black px-6 py-3 rounded-full font-bold w-fit flex items-center gap-2">
              <Play weight="fill" /> Continue Reading
            </button>
          </div>
        </div>
      </section>

      {/* 10. The Abstract Concentric */}
      <section className="max-w-5xl mx-auto w-full mb-32">
        <h2 className="text-2xl font-bold mb-6 text-accent">10. The Abstract Concentric Focus</h2>
        <div className="w-full py-20 flex flex-col items-center justify-center relative overflow-hidden bg-surface-raised rounded-[3rem] border border-border-subtle">
          {/* Concentric circles */}
          <div className="absolute w-[800px] h-[800px] rounded-full border border-border-subtle/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[600px] h-[600px] rounded-full border border-border-subtle/80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-accent/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          
          <div className="w-[140px] aspect-[3/4] rounded-full overflow-hidden mb-8 relative z-10 shadow-[0_0_40px_rgba(var(--accent-rgb),0.3)] border-4 border-background">
            <img src={MOCK_DATA.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          </div>
          
          <div className="relative z-10 text-center max-w-xl px-4">
            <h3 className="text-3xl font-bold mb-3 tracking-widest uppercase">{MOCK_DATA.title}</h3>
            <div className="flex justify-center items-center gap-4 text-text-muted mb-8 text-sm tracking-widest">
              <span>{MOCK_DATA.status}</span>
              <span className="w-1 h-1 bg-border-strong rounded-full" />
              <span>{MOCK_DATA.format}</span>
            </div>
            <button className="border border-accent text-accent hover:bg-accent hover:text-white px-8 py-3 rounded-full font-bold transition-colors">
              READ {MOCK_DATA.chapter}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
