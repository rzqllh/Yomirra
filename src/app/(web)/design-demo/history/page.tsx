"use client";

import React from "react";
import { motion } from "motion/react";
import { Play, Clock, ArrowRight } from "@phosphor-icons/react";

// Dummy Data
const dummyHistory = [
  { id: 1, title: "Solo Leveling", chapter: "Chapter 110", time: "2 jam lalu", cover: "https://example.com/1.jpg", progress: 60 },
  { id: 2, title: "Jujutsu Kaisen", chapter: "Chapter 236", time: "5 jam lalu", cover: "https://example.com/2.jpg", progress: 100 },
  { id: 3, title: "One Piece", chapter: "Chapter 1100", time: "Kemarin", cover: "https://example.com/3.jpg", progress: 10 },
  { id: 4, title: "Chainsaw Man", chapter: "Chapter 150", time: "2 hari lalu", cover: "https://example.com/4.jpg", progress: 95 },
];

export default function HistoryDesignDemoPage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary pb-32">
      <div className="pt-[calc(var(--safe-top)+24px)] pb-12 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-black mb-4">History Design Demos</h1>
        <p className="text-text-muted">10 unique, borderless, shadowless anti-slop concepts.</p>
      </div>

      <div className="flex flex-col gap-32 max-w-7xl mx-auto px-6">
        
        {/* DESIGN 1: Cinematic Hero + Bento */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 01 / Cinematic Hero & Bento</h2>
          <div className="w-full h-[50vh] rounded-3xl overflow-hidden relative mb-4 group cursor-pointer">
            <div className="absolute inset-0 bg-surface-muted animate-pulse" /> {/* Fallback if no image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
              <div>
                <p className="text-accent font-bold text-sm mb-2">{dummyHistory[0].time}</p>
                <h3 className="text-5xl font-black text-white leading-tight">{dummyHistory[0].title}</h3>
                <p className="text-white/80 font-medium mt-2 text-lg">{dummyHistory[0].chapter}</p>
              </div>
              <button className="h-16 w-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                <Play weight="fill" size={24} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full z-20">
              <div className="h-full bg-accent w-[60%]" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dummyHistory.slice(1).map(item => (
              <div key={item.id} className="bg-surface-raised rounded-3xl p-6 flex flex-col justify-between aspect-square group cursor-pointer hover:bg-surface-hover transition-colors">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-text-muted">{item.time}</span>
                  <div className="h-10 w-10 bg-surface-muted rounded-full flex items-center justify-center text-text-primary group-hover:bg-accent group-hover:text-white transition-colors">
                    <Play weight="fill" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-1">{item.title}</h4>
                  <p className="text-text-muted">{item.chapter}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 2: The Minimalist Timeline */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 02 / Minimalist Timeline</h2>
          <div className="space-y-0">
            {dummyHistory.map((item, i) => (
              <div key={item.id} className="flex group cursor-pointer">
                <div className="w-32 py-8 pr-8 border-r border-border-subtle flex flex-col justify-center text-right">
                  <span className="font-mono text-xs text-text-muted">{item.time.toUpperCase()}</span>
                </div>
                <div className="flex-1 py-8 pl-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight group-hover:text-accent transition-colors">{item.title}</h3>
                    <p className="text-text-muted mt-1">{item.chapter}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 3: Edge-to-Edge List */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 03 / Edge-to-Edge Minimal</h2>
          <div className="flex flex-col">
            {dummyHistory.map(item => (
              <div key={item.id} className="group cursor-pointer py-6 border-b border-border-subtle flex items-center gap-6">
                <div className="w-16 h-20 bg-surface-muted rounded-lg shrink-0 overflow-hidden relative">
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-accent/30">
                    <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-bold truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-text-primary">{item.chapter}</span>
                    <span className="text-xs text-text-muted">· {item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 4: Typographic Poster */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 04 / Typographic Poster</h2>
          <div className="flex flex-col">
            {dummyHistory.map(item => (
              <div key={item.id} className="relative group cursor-pointer py-4 border-b border-border-glass">
                <h3 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent w-full truncate" style={{ WebkitTextStroke: '1px var(--color-text-muted)' }}>
                  <span className="group-hover:text-text-primary transition-colors duration-500" style={{ WebkitTextStroke: '0px' }}>{item.title}</span>
                </h3>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-right">
                    <p className="font-bold">{item.chapter}</p>
                    <p className="text-xs text-text-muted">{item.time}</p>
                  </div>
                  <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center text-white">
                    <Play weight="fill" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 5: The Floating Gallery */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 05 / Gallery Strip</h2>
          <div className="flex gap-4 overflow-x-auto pb-8 [scrollbar-width:none]">
            {dummyHistory.map(item => (
              <div key={item.id} className="w-[300px] shrink-0 group cursor-pointer">
                <div className="aspect-[3/4] bg-surface-muted rounded-2xl mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-500">
                    <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                      <Play weight="fill" size={24} />
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-lg leading-tight">{item.title}</h4>
                <p className="text-text-muted text-sm mt-1">{item.chapter}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 6: Asymmetric Magazine */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 06 / Asymmetric Magazine</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 bg-surface-raised rounded-[2rem] p-8 md:p-12 flex flex-col justify-end min-h-[400px] group cursor-pointer hover:bg-surface-hover transition-colors relative overflow-hidden">
               <div className="absolute top-8 left-8 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{dummyHistory[0].time}</div>
               <div>
                 <h3 className="text-4xl md:text-5xl font-black mb-2">{dummyHistory[0].title}</h3>
                 <p className="text-xl text-text-muted">{dummyHistory[0].chapter}</p>
               </div>
            </div>
            <div className="md:col-span-4 flex flex-col gap-8">
               {dummyHistory.slice(1,3).map(item => (
                 <div key={item.id} className="bg-surface-raised rounded-[2rem] p-8 flex-1 flex flex-col justify-between group cursor-pointer hover:bg-surface-hover transition-colors">
                    <span className="text-xs font-bold text-text-muted uppercase">{item.time}</span>
                    <div>
                      <h4 className="text-2xl font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-text-muted">{item.chapter}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>
        
        {/* DESIGN 7: Avatar List */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 07 / Avatar List</h2>
          <div className="space-y-4">
            {dummyHistory.map(item => (
              <div key={item.id} className="flex items-center gap-6 p-4 rounded-full hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="w-16 h-16 rounded-full bg-surface-muted shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{item.title}</h4>
                  <p className="text-text-muted text-sm">{item.chapter}</p>
                </div>
                <div className="text-sm font-medium text-text-muted pr-4">{item.time}</div>
                <div className="w-10 h-10 rounded-full bg-surface-glass backdrop-blur flex items-center justify-center text-text-primary">
                   <Play weight="fill" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 8: Data Dense Table */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 08 / Data Dense</h2>
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-border-strong text-xs font-bold text-text-muted uppercase tracking-wider">
              <div className="col-span-6">Title</div>
              <div className="col-span-3">Progress</div>
              <div className="col-span-3 text-right">Last Read</div>
            </div>
            {dummyHistory.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-4 border-b border-border-subtle hover:bg-surface-hover cursor-pointer items-center transition-colors">
                <div className="col-span-6 font-bold truncate pr-4">{item.title}</div>
                <div className="col-span-3 text-sm text-text-secondary">{item.chapter} <span className="text-xs text-text-muted opacity-50">({item.progress}%)</span></div>
                <div className="col-span-3 text-right text-sm text-text-muted font-mono">{item.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN 9: Giant Progress Rings */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 09 / Progress Rings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {dummyHistory.map(item => (
               <div key={item.id} className="flex flex-col items-center text-center cursor-pointer group">
                  <div className="w-32 h-32 rounded-full border-4 border-surface-raised flex items-center justify-center mb-6 relative">
                     {/* SVG ring would go here based on progress */}
                     <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="60" stroke="var(--color-accent)" strokeWidth="4" fill="none" strokeDasharray="377" strokeDashoffset={377 - (377 * item.progress / 100)} className="transition-all duration-1000" />
                     </svg>
                     <span className="text-xl font-black">{item.progress}%</span>
                  </div>
                  <h4 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors">{item.title}</h4>
                  <p className="text-text-muted text-sm mt-1">{item.chapter}</p>
               </div>
             ))}
          </div>
        </section>

        {/* DESIGN 10: Glass Ticket */}
        <section>
          <h2 className="text-xs font-bold text-accent tracking-widest uppercase mb-8">Design 10 / Ticket Stub</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dummyHistory.map(item => (
              <div key={item.id} className="flex bg-surface-raised rounded-3xl overflow-hidden cursor-pointer group hover:bg-surface-hover transition-colors">
                <div className="w-24 bg-surface-muted shrink-0 relative">
                   <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-base rounded-full" />
                </div>
                <div className="flex-1 p-6 border-l-2 border-dashed border-border-subtle relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-base rounded-full" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{item.time}</span>
                  <h4 className="text-2xl font-bold mt-2 mb-1 truncate">{item.title}</h4>
                  <p className="text-text-secondary">{item.chapter}</p>
                  <div className="mt-4 flex items-center gap-2 text-accent font-bold text-sm">
                    Continue <ArrowRight />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
