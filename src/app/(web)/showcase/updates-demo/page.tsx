"use client";

import * as React from "react";
import { 
  CalendarBlank, 
  Sparkle, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  ArrowsClockwise, 
  CaretDown,
  Bell,
  BookBookmark,
  Funnel
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock Data Update 7 Hari untuk Live Demo Realistis
interface DemoManga {
  id: string;
  title: string;
  chapter: string;
  source: string;
  time: string;
  coverUrl: string;
  dayIndex: number; // 0 = Hari Ini (Kamis), 1 = Kemarin (Rabu), dst.
}

const MOCK_DAYS = [
  { index: 0, dayName: "Kamis", shortDay: "Kam", dateNum: 17, isToday: true, count: 5 },
  { index: 1, dayName: "Rabu", shortDay: "Rab", dateNum: 16, isToday: false, count: 8 },
  { index: 2, dayName: "Selasa", shortDay: "Sel", dateNum: 15, isToday: false, count: 3 },
  { index: 3, dayName: "Senin", shortDay: "Sen", dateNum: 14, isToday: false, count: 6 },
  { index: 4, dayName: "Minggu", shortDay: "Min", dateNum: 13, isToday: false, count: 2 },
  { index: 5, dayName: "Sabtu", shortDay: "Sab", dateNum: 12, isToday: false, count: 4 },
  { index: 6, dayName: "Jumat", shortDay: "Jum", dateNum: 11, isToday: false, count: 7 },
];

const MOCK_UPDATES: DemoManga[] = [
  // Hari Ini (Kamis)
  {
    id: "1",
    title: "Academy's Genius Swordmaster",
    chapter: "Chapter 154",
    source: "shinigami",
    time: "08:30",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
    dayIndex: 0,
  },
  {
    id: "2",
    title: "Return of the SSS-Class Ranker",
    chapter: "Chapter 200",
    source: "shinigami",
    time: "08:30",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
    dayIndex: 0,
  },
  {
    id: "3",
    title: "I Killed An Academy Player",
    chapter: "Chapter 140",
    source: "shinigami",
    time: "08:30",
    coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80",
    dayIndex: 0,
  },
  {
    id: "4",
    title: "Tsuihou Sareta Tenshou Juu Kishi",
    chapter: "Chapter 179",
    source: "komiku",
    time: "08:27",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
    dayIndex: 0,
  },
  {
    id: "5",
    title: "Revenge of the Iron-Blooded Sword Hound",
    chapter: "Chapter 92",
    source: "shinigami",
    time: "06:15",
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
    dayIndex: 0,
  },
  // Kemarin (Rabu)
  {
    id: "6",
    title: "Solo Leveling: Ragnarok",
    chapter: "Chapter 38",
    source: "shinigami",
    time: "22:10",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
    dayIndex: 1,
  },
  {
    id: "7",
    title: "The Greatest Estate Developer",
    chapter: "Chapter 165",
    source: "komiku",
    time: "19:45",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
    dayIndex: 1,
  },
  // Hari Lain
  {
    id: "8",
    title: "Omniscient Reader's Viewpoint",
    chapter: "Chapter 230",
    source: "shinigami",
    time: "14:20",
    coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80",
    dayIndex: 2,
  },
  {
    id: "9",
    title: "Nano Machine",
    chapter: "Chapter 228",
    source: "shinigami",
    time: "23:55",
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
    dayIndex: 3,
  },
];

export default function UpdatesDemoShowcase() {
  const [activeDemo, setActiveDemo] = React.useState<number>(1);
  const [selectedDay, setSelectedDay] = React.useState<number>(0);

  const filteredManga = React.useMemo(() => {
    return MOCK_UPDATES.filter((item) => item.dayIndex === selectedDay);
  }, [selectedDay]);

  const currentDayInfo = MOCK_DAYS.find((d) => d.index === selectedDay) || MOCK_DAYS[0];

  return (
    <main className="min-h-screen bg-surface-base text-text-primary pb-28">
      {/* Dev Tooling Header Banner */}
      <div className="bg-accent/15 border-b border-accent/25 px-4 py-3 sticky top-0 z-[var(--z-sticky)] backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="text-xs sm:text-sm font-bold text-accent">
              10 LIVE DEMO: Seleksi Update Berdasarkan Hari (Bstation Style)
            </span>
          </div>
          <span className="text-[11px] text-text-muted">
            Klik nomor varian di bawah untuk melihat interaksi dan layoutnya.
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {/* Selector Switcher Varian 1-10 */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Pilih Varian Desain (1 s/d 10):
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 1, title: "1. Editorial Chips" },
              { id: 2, title: "2. 7-Day Grid Slider" },
              { id: 3, title: "3. Bento Date Cards" },
              { id: 4, title: "4. Minimalist Line" },
              { id: 5, title: "5. Floating Island Dock" },
              { id: 6, title: "6. Capsule Day Pill" },
              { id: 7, title: "7. Segmented Quick Rail" },
              { id: 8, title: "8. Status Dot Planner" },
              { id: 9, title: "9. Relative Day Flow" },
              { id: 10, title: "10. Compact Micro Calendar" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setActiveDemo(v.id);
                  setSelectedDay(0); // reset ke hari ini
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none shadow-xs active:scale-95",
                  activeDemo === v.id
                    ? "bg-accent text-white border-accent shadow-xs"
                    : "bg-surface-raised text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary"
                )}
              >
                {v.title}
              </button>
            ))}
          </div>
        </section>

        {/* Frame Simulasi Live Demo */}
        <div className="rounded-3xl border border-border-default/60 bg-surface-raised/40 p-4 sm:p-6 shadow-sm space-y-6">
          <div className="border-b border-border-subtle/60 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                Varian Aktif: #{activeDemo}
              </span>
              <h3 className="text-lg font-bold text-text-primary mt-0.5">
                {activeDemo === 1 && "Varian 1: Modern Editorial Day Chips"}
                {activeDemo === 2 && "Varian 2: Segmented 7-Day Grid Slider (Ultra-Compact)"}
                {activeDemo === 3 && "Varian 3: Bento Date Cards with Update Counter"}
                {activeDemo === 4 && "Varian 4: Minimalist Text Underline Tab"}
                {activeDemo === 5 && "Varian 5: Floating Island Day Dock"}
                {activeDemo === 6 && "Varian 6: Capsule Day Pill with Micro-Dot"}
                {activeDemo === 7 && "Varian 7: Segmented Quick Rail (Hari Ini / Kemarin / Hari)"}
                {activeDemo === 8 && "Varian 8: Status Dot Planner (Bstation Standard)"}
                {activeDemo === 9 && "Varian 9: Relative Day Flow with Natural Badges"}
                {activeDemo === 10 && "Varian 10: Compact Micro Calendar Square"}
              </h3>
            </div>
            <Badge variant="outline" className="rounded-lg text-[10px] hidden sm:inline-flex">
              Interactive Live Preview
            </Badge>
          </div>

          {/* ==================== 10 VARIAN HEADER INTERAKTIF ==================== */}

          {/* Varian 1: Editorial Chips */}
          {activeDemo === 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] snap-x">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "relative flex-shrink-0 snap-start flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border outline-none active:scale-95 shadow-xs",
                      isSelected
                        ? "bg-accent text-white border-accent shadow-xs"
                        : "bg-surface-glass border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
                    )}
                  >
                    <span>{day.isToday ? "Hari Ini" : day.dayName}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-lg font-bold",
                      isSelected ? "bg-white/20 text-white" : "bg-surface-raised text-text-muted border border-border-subtle"
                    )}>
                      {day.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 2: 7-Day Grid Slider (Ultra-Compact) */}
          {activeDemo === 2 && (
            <div className="grid grid-cols-7 gap-1 p-1.5 rounded-2xl bg-surface-glass border border-border-subtle">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all outline-none active:scale-95",
                      isSelected
                        ? "bg-accent text-white font-bold shadow-xs"
                        : "text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary"
                    )}
                  >
                    <span className="text-[10px] uppercase font-semibold opacity-80">{day.shortDay}</span>
                    <span className="text-sm font-black mt-0.5">{day.dateNum}</span>
                    {day.count > 0 && (
                      <span className={cn(
                        "size-1 rounded-full mt-1",
                        isSelected ? "bg-white" : "bg-semantic-error"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 3: Bento Date Cards */}
          {activeDemo === 3 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none]">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "flex-shrink-0 w-24 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all outline-none active:scale-95 shadow-xs",
                      isSelected
                        ? "bg-accent/15 border-accent text-accent ring-1 ring-accent"
                        : "bg-surface-glass border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</span>
                    <span className="text-lg font-black text-text-primary">{day.dateNum}</span>
                    <span className="text-[10px] font-semibold text-text-muted">
                      {day.count} judul
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 4: Minimalist Text Underline Tab */}
          {activeDemo === 4 && (
            <div className="flex border-b border-border-subtle gap-6 overflow-x-auto [scrollbar-width:none]">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "relative pb-3 flex items-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap outline-none",
                      isSelected ? "text-accent" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <span>{day.isToday ? "Hari Ini" : `${day.dayName} (${day.dateNum})`}</span>
                    {day.count > 0 && (
                      <span className="size-1.5 rounded-full bg-semantic-error" />
                    )}
                    {isSelected && (
                      <motion.div
                        layoutId="underline-active-demo"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-accent"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 5: Floating Island Day Dock */}
          {activeDemo === 5 && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-glass shadow-glass overflow-x-auto max-w-full">
                {MOCK_DAYS.map((day) => {
                  const isSelected = selectedDay === day.index;
                  return (
                    <button
                      key={day.index}
                      onClick={() => setSelectedDay(day.index)}
                      className={cn(
                        "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none whitespace-nowrap active:scale-95",
                        isSelected
                          ? "bg-accent text-white shadow-xs"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
                      )}
                    >
                      {day.isToday ? "Hari Ini" : day.shortDay}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Varian 6: Capsule Day Pill with Micro-Dot */}
          {activeDemo === 6 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all outline-none active:scale-95 shadow-xs whitespace-nowrap",
                      isSelected
                        ? "bg-surface-raised border-accent text-accent"
                        : "bg-surface-glass border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
                    )}
                  >
                    <span className={cn("size-2 rounded-full", isSelected ? "bg-accent" : "bg-semantic-error")} />
                    <span>{day.dayName}</span>
                    <span className="text-[10px] text-text-muted">({day.count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 7: Segmented Quick Rail */}
          {activeDemo === 7 && (
            <div className="space-y-2">
              <div className="flex gap-1.5 p-1 rounded-2xl bg-surface-raised border border-border-subtle overflow-x-auto">
                {MOCK_DAYS.slice(0, 4).map((day) => {
                  const isSelected = selectedDay === day.index;
                  return (
                    <button
                      key={day.index}
                      onClick={() => setSelectedDay(day.index)}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all outline-none whitespace-nowrap text-center",
                        isSelected ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {day.index === 0 ? "Hari Ini" : day.index === 1 ? "Kemarin" : day.dayName}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1 overflow-x-auto px-1 text-[11px] text-text-muted">
                <span>Hari sebelumnya:</span>
                {MOCK_DAYS.slice(4).map((day) => (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "underline ml-1 hover:text-accent",
                      selectedDay === day.index && "text-accent font-bold"
                    )}
                  >
                    {day.dayName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Varian 8: Status Dot Planner (Bstation Standard) */}
          {activeDemo === 8 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "flex-1 min-w-[54px] py-2 px-1 rounded-2xl flex flex-col items-center gap-1 border transition-all outline-none active:scale-95",
                      isSelected
                        ? "bg-accent text-white border-accent shadow-xs"
                        : "bg-surface-glass border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase">{day.shortDay}</span>
                    <span className="text-xs font-extrabold">{day.dateNum}</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded-full font-bold",
                      isSelected ? "bg-white/20 text-white" : "bg-semantic-error/15 text-semantic-error"
                    )}>
                      {day.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 9: Relative Day Flow */}
          {activeDemo === 9 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all outline-none active:scale-95 flex items-center gap-2 whitespace-nowrap",
                      isSelected
                        ? "bg-text-primary text-surface-base border-text-primary shadow-xs"
                        : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
                    )}
                  >
                    <span>{day.index === 0 ? "Hari Ini" : day.index === 1 ? "Kemarin" : `${day.dayName}, ${day.dateNum} Sep`}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md",
                      isSelected ? "bg-surface-base/20 text-surface-base" : "bg-surface-muted text-text-muted"
                    )}>
                      {day.count} update
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Varian 10: Compact Micro Calendar Square */}
          {activeDemo === 10 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {MOCK_DAYS.map((day) => {
                const isSelected = selectedDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={cn(
                      "size-14 rounded-2xl flex flex-col items-center justify-center border transition-all outline-none active:scale-95 shrink-0 relative",
                      isSelected
                        ? "bg-accent/15 border-accent text-accent shadow-xs"
                        : "bg-surface-glass border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold">{day.shortDay}</span>
                    <span className="text-sm font-black text-text-primary">{day.dateNum}</span>
                    {day.count > 0 && (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-semantic-error ring-2 ring-surface-base" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ==================== LIST HASIL FILTER BERDASARKAN HARI ==================== */}
          <div className="pt-4 border-t border-border-subtle/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <CalendarBlank size={14} className="text-accent" />
                Rilis {currentDayInfo.dayName}, {currentDayInfo.dateNum} September ({filteredManga.length} judul)
              </h4>
              <span className="text-[11px] text-text-muted">
                {currentDayInfo.isToday ? "✨ Rilis Terbaru Hari Ini" : "Arsip Rilis"}
              </span>
            </div>

            {filteredManga.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-base/60 border border-border-subtle border-dashed text-center text-xs text-text-muted">
                Tidak ada riwayat chapter rilis di hari {currentDayInfo.dayName}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredManga.map((manga) => (
                  <div
                    key={manga.id}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-strong hover:bg-surface-hover transition-all group shadow-xs"
                  >
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-base border border-border-subtle/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-sm text-text-primary truncate group-hover:text-accent transition-colors">
                        {manga.title}
                      </h5>
                      <p className="text-xs font-bold text-accent mt-0.5">
                        {manga.chapter}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                        <span className="uppercase font-semibold tracking-wider">{manga.source}</span>
                        <span>•</span>
                        <span>{manga.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Petunjuk Pemilihan */}
        <div className="p-4 rounded-2xl bg-surface-glass border border-border-subtle text-xs text-text-muted leading-relaxed space-y-1.5">
          <p className="font-bold text-text-primary">💡 Catatan Desain Xyeena:</p>
          <p>
            Semua 10 varian di atas memakai <strong>logika rilis harian (Bstation style)</strong> yang murni memfilter update library berdasarkan hari, namun dibungkus dengan <strong>bahasa visual Yomirra (concentric squircle, frosted glass, typography tokens, dan indicator dots)</strong>.
          </p>
          <p>
            Buka rute ini di browser Anda: <code className="text-accent font-mono bg-accent/10 px-1.5 py-0.5 rounded">http://localhost:3000/showcase/updates-demo</code> lalu pilih varian nomor berapa yang paling Anda sukai untuk diterapkan ke tab Updates resmi!
          </p>
        </div>
      </div>
    </main>
  );
}
