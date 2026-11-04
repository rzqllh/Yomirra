"use client"

import * as React from "react"
import {
  Flask,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle,
  WarningCircle,
  HandPointing,
  CaretRight,
  BookOpenText,
  ClockCounterClockwise,
  Info,
  DeviceMobile,
  Desktop,
} from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import {
  DockVariantProps,
  Variant1Baseline,
  Variant2UnifiedPill,
  Variant3DynamicIsland,
  Variant4IOSGlass,
  Variant5MaterialExpressive,
  Variant6MinimalistMicro,
  Variant7SegmentedPro,
  Variant8DualTone,
  Variant9EdgeToEdge,
  Variant10AsymmetricThumb,
} from "@/components/lab/dock-variants"

interface VariantMeta {
  id: number
  codename: string
  title: string
  archetype: string
  tag: string
  height: string
  reachability: "A+" | "A" | "B+" | "B"
  motionLevel: "Low" | "Medium" | "High"
  description: string
  pros: string[]
  cons: string[]
  component: React.ComponentType<DockVariantProps>
}

const VARIANTS: VariantMeta[] = [
  {
    id: 1,
    codename: "Baseline Yomirra",
    title: "Varian 1: Baseline Satellite",
    archetype: "Segmented Bar + Detached Floating Pill",
    tag: "Existing Production",
    height: "56px + 48px Satellite",
    reachability: "A",
    motionLevel: "Low",
    description:
      "Desain existing Yomirra: 4-tab docked di dalam kapsul kaca utama, dan 1 tombol satellite 'Cari' mengambang di kanan. Memberikan fokus cepat ke pencarian tanpa mengganggu grid tab utama.",
    pros: [
      "Pencarian instan dan kontras tinggi",
      "Tab navigasi padat dan terstruktur rapi",
      "Sudah familiar bagi pengguna Yomirra",
    ],
    cons: [
      "Dua elemen terpisah memakan ruang horisontal lebih lebar",
      "Asimetri visual dapat mengganggu keselarasan margin di layar sangat sempit (<360px)",
    ],
    component: Variant1Baseline,
  },
  {
    id: 2,
    codename: "Unified Pill",
    title: "Varian 2: Unified Pill (Centered Float)",
    archetype: "Monolithic Floating Island",
    tag: "Minimalist Floating",
    height: "58px",
    reachability: "A+",
    motionLevel: "Medium",
    description:
      "Menggabungkan kelima tab (termasuk Cari) ke dalam satu kapsul simetris mengambang dengan layout spring pill aktif. Desain bersih ala Dynamic Island / iOS modern.",
    pros: [
      "Simetris penuh dan stabil di semua viewport",
      "Spring indicator aktif halus mengikuti pergeseran tab",
      "Kompak dan tidak menabrak tombol sistem Android/iOS",
    ],
    cons: [
      "5 tab dalam satu baris membutuhkan padding horizontal ketat di layar 320px",
    ],
    component: Variant2UnifiedPill,
  },
  {
    id: 3,
    codename: "Dynamic Island",
    title: "Varian 3: Dynamic Island Yomirra (Terpilih)",
    archetype: "Fluid Morphing Glass Capsule + Prominent Search",
    tag: "Pilihan Owner — Yomirra Native",
    height: "56px (Concentric rounded-2xl)",
    reachability: "A+",
    motionLevel: "Medium",
    description:
      "Desain Dynamic Island yang di-redesign menggunakan layout language, concentric squircle radius, dan semantic tokens Yomirra (.yomirra-chrome). Bebas hardcoded black/white (100% Light/Dark adaptive), memiliki tombol Cari prominent dengan divider kaca, safe-area iOS, dan morphing tab beranimasi spring.",
    pros: [
      "100% selaras dengan design tokens Yomirra (.yomirra-chrome & var(--surface-glass))",
      "Adaptif otomatis terhadap Dark Mode & Light Mode tanpa warna hardcoded",
      "Tombol Cari prominent dengan aksen punch dan divider kaca pemisah",
      "Target sentuh terverifikasi minimal 44x44px di setiap tombol",
      "Fluid morphing container dengan spring animation yang dinamis & responsif",
    ],
    cons: [
      "Memerlukan GPU compositing ringan untuk backdrop-filter blur 20px pada perangkat ultra low-end",
    ],
    component: Variant3DynamicIsland,
  },
  {
    id: 4,
    codename: "iOS Liquid Glass",
    title: "Varian 4: iOS Liquid Glass",
    archetype: "Frosted Glassmorphism Layer",
    tag: "Cupertino Inspired",
    height: "60px",
    reachability: "A",
    motionLevel: "Low",
    description:
      "Glassmorphism ultra-halus dengan border gradasi berpendar, blur backdrop tebal (32px), dan pantulan spekular halus. Menyatu alami dengan wallpaper dan cover komik di baliknya.",
    pros: [
      "Estetika visual sangat tinggi, mewah, dan modern",
      "Konten di balik dock tetap terlihat secara lembut dan elegan",
      "Konsisten dengan tren UI OS modern",
    ],
    cons: [
      "Backdrop blur intensif membutuhkan GPU compositing yang efisien pada perangkat low-end",
    ],
    component: Variant4IOSGlass,
  },
  {
    id: 5,
    codename: "Material 3 Expressive",
    title: "Varian 5: Material 3 Expressive",
    archetype: "Active Pill Container + Micro Indicator",
    tag: "Android 15 Guidelines",
    height: "64px",
    reachability: "A+",
    motionLevel: "Medium",
    description:
      "Mengadopsi bahasa Material You / Material 3 Expressive. Tab aktif dibungkus 'active indicator capsule' dengan label vertikal yang selalu terbaca jelas.",
    pros: [
      "Label teks selalu terlihat, zero ambiguitas ikon",
      "Sangat ramah aksesibilitas dan kemudahan sentuh",
      "Pemberian badge angka sangat kontras dan tegas",
    ],
    cons: [
      "Membutuhkan tinggi dock sedikit lebih besar (64px) untuk menampung teks dua baris",
    ],
    component: Variant5MaterialExpressive,
  },
  {
    id: 6,
    codename: "Minimalist Micro",
    title: "Varian 6: Minimalist Micro Dock",
    archetype: "Compact Floating Bar (Low Profile)",
    tag: "Screen Space Saver",
    height: "46px",
    reachability: "B+",
    motionLevel: "Low",
    description:
      "Dirancang khusus untuk pembaca manga yang menginginkan area layar semaksimal mungkin. Tinggi ultra-ramping (46px) dengan tap-target internal yang tetap memenuhi standar 44px WCAG.",
    pros: [
      "Okupasi layar terendah dari semua varian",
      "Irit ruang vertikal, sangat ideal untuk ponsel berlayar rasio 16:9 atau kecil",
      "Fokus penuh pada konten manga",
    ],
    cons: [
      "Margin sentuh antar ikon lebih rapat",
      "Tidak ada label teks permanen",
    ],
    component: Variant6MinimalistMicro,
  },
  {
    id: 7,
    codename: "Segmented Pro",
    title: "Varian 7: Segmented Pro Dock",
    archetype: "Desktop/Tablet Hybrid Container",
    tag: "Productivity Reader",
    height: "56px",
    reachability: "A",
    motionLevel: "Medium",
    description:
      "Format segmented rail dengan divider mikro antar kategori (Main Browsing vs Personal Library & Search). Memberikan struktur hirarki yang jelas seperti dashboard pro.",
    pros: [
      "Pemisahan visual antara navigasi bacaan dan alat pencarian",
      "Sangat kokoh dan rapi di tablet maupun landscape mobile",
      "Indikator status bergaris tebal di bawah tab aktif",
    ],
    cons: [
      "Garis pemisah menambah sedikit kepadatan visual di layar kecil",
    ],
    component: Variant7SegmentedPro,
  },
  {
    id: 8,
    codename: "Dual-Tone Elevated",
    title: "Varian 8: Dual-Tone Elevated",
    archetype: "Dual-Layer Shadow Float",
    tag: "Depth & Contrast",
    height: "58px",
    reachability: "A",
    motionLevel: "Low",
    description:
      "Menggunakan dua lapis bayangan (ambient diffuse + key directional shadow) dan ring kontras tinggi. Dock terlihat melayang 12px di atas permukaan aplikasi.",
    pros: [
      "Kontras sangat tinggi bahkan di atas cover manga dengan warna kompleks",
      "Tidak bergantung penuh pada backdrop-filter di peramban lama",
      "Nuansa fisik yang mantap",
    ],
    cons: [
      "Membutuhkan margin samping ekstra agar efek elevasi bayangan tidak terpotong",
    ],
    component: Variant8DualTone,
  },
  {
    id: 9,
    codename: "Edge-to-Edge Fluid",
    title: "Varian 9: Edge-to-Edge Fluid Surface",
    archetype: "Full-Width Bottom Navigation Bar",
    tag: "Classic Native App",
    height: "58px + Safe Area",
    reachability: "A+",
    motionLevel: "Medium",
    description:
      "Gaya navigasi native klasik: membentang penuh dari sisi kiri ke sisi kanan layar, terintegrasi mulus dengan safe area home indicator iOS/Android tanpa celah floating.",
    pros: [
      "Zero dead-space di bawah atau di samping dock",
      "Area sentuh membentang rata dan sangat stabil di tepi bawah",
      "Gaya native paling umum di aplikasi komik besar (Webtoon, MangaPlus)",
    ],
    cons: [
      "Menutup area konten bawah secara penuh (bukan floating)",
    ],
    component: Variant9EdgeToEdge,
  },
  {
    id: 10,
    codename: "Asymmetric Thumb",
    title: "Varian 10: Asymmetric Thumb Curve",
    archetype: "Ergonomic One-Handed Sweep",
    tag: "Ergonomics First",
    height: "60px",
    reachability: "A+",
    motionLevel: "Medium",
    description:
      "Didesain khusus untuk penggunaan satu tangan (jempol kanan). Tombol aksi cepat 'Cari' diletakkan paling kanan dan berukuran lebih besar, mengikuti kurva jangkauan natural jempol.",
    pros: [
      "Jangkauan satu tangan terbaik di ponsel berukuran besar (Pro Max / Ultra)",
      "Aksi primer 'Cari' sangat mudah dipicu saat membaca sambil berjalan",
      "Unik dan inovatif tanpa mengorbankan fungsi dasar",
    ],
    cons: [
      "Sedikit kurang optimal jika pengguna terbiasa memegang ponsel dengan tangan kiri penuh",
    ],
    component: Variant10AsymmetricThumb,
  },
]

export function DockLabView() {
  const [selectedVariantId, setSelectedVariantId] = React.useState<number>(3)
  const [activeTab, setActiveTab] = React.useState<string>("beranda")
  const [safeAreaBottom, setSafeAreaBottom] = React.useState<number>(16)
  const [showTargetOverlay, setShowTargetOverlay] = React.useState<boolean>(false)
  const [isReducedMotion, setIsReducedMotion] = React.useState<boolean>(false)
  const [viewMode, setViewMode] = React.useState<"phone" | "fullscreen">("phone")
  const [simulatedTheme, setSimulatedTheme] = React.useState<"dark" | "light">("dark")

  const currentVariant = VARIANTS.find((v) => v.id === selectedVariantId) ?? VARIANTS[0]
  const ActiveDockComponent = currentVariant.component

  // Keyboard navigation between variants: [ for prev, ] for next
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "[" || e.key === "ArrowLeft") {
        setSelectedVariantId((prev) => (prev > 1 ? prev - 1 : VARIANTS.length))
      } else if (e.key === "]" || e.key === "ArrowRight") {
        setSelectedVariantId((prev) => (prev < VARIANTS.length ? prev + 1 : 1))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-surface-base text-text-primary transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
              <Flask size={20} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">YOMIRRA DOCK LAB</span>
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                  PREVIEW / BENCHMARK ONLY
                </span>
              </div>
              <p className="text-xs text-text-muted">
                10 Varian Navigasi Bawah Interaktif &bull; Antislop &bull; 44px Hit Target Guarded
              </p>
            </div>
          </div>

          {/* Quick Prev / Next controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedVariantId((prev) => (prev > 1 ? prev - 1 : VARIANTS.length))}
              className="flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-text-secondary hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent"
              title="Varian Sebelumnya (Tombol [ atau Panah Kiri)"
              aria-label="Varian Sebelumnya"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs font-mono font-medium text-text-muted px-1">
              {currentVariant.id} / {VARIANTS.length}
            </span>
            <button
              type="button"
              onClick={() => setSelectedVariantId((prev) => (prev < VARIANTS.length ? prev + 1 : 1))}
              className="flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-text-secondary hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent"
              title="Varian Berikutnya (Tombol ] atau Panah Kanan)"
              aria-label="Varian Berikutnya"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Variant Tabs Bar */}
        <div className="overflow-x-auto border-t border-border-subtle/60 scrollbar-none">
          <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-2 sm:px-6">
            {VARIANTS.map((v) => {
              const isSelected = v.id === selectedVariantId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "bg-accent text-accent-contrast shadow-sm font-semibold"
                      : "bg-surface-raised/60 text-text-muted hover:bg-surface-raised hover:text-text-primary border border-border-subtle/50"
                  )}
                  aria-pressed={isSelected}
                >
                  <span className={cn(
                    "flex size-4 items-center justify-center rounded text-[10px] font-bold",
                    isSelected ? "bg-black/20 text-white" : "bg-surface-base text-text-muted"
                  )}>
                    {v.id}
                  </span>
                  <span>{v.codename}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Controls & Simulator Frame (lg:col-span-7) */}
          <section className="flex flex-col items-center lg:col-span-7">
            
            {/* Control Strip */}
            <div className="mb-4 flex w-full max-w-md flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface-raised p-2 text-xs">
              {/* Safe Area Switcher */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-text-muted px-1">Safe Area:</span>
                {[
                  { label: "0px", val: 0 },
                  { label: "16px", val: 16 },
                  { label: "34px", val: 34 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSafeAreaBottom(s.val)}
                    className={cn(
                      "rounded px-2 py-1 font-mono transition-colors",
                      safeAreaBottom === s.val
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-1.5">
                {/* 44px Touch Target Overlay */}
                <button
                  type="button"
                  onClick={() => setShowTargetOverlay(!showTargetOverlay)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    showTargetOverlay
                      ? "bg-emerald-500/20 text-emerald-400 font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  )}
                  title="Toggle highlight target sentuh minimal 44px WCAG"
                >
                  <HandPointing size={14} />
                  <span>Target 44px</span>
                </button>

                {/* Reduced Motion Toggle */}
                <button
                  type="button"
                  onClick={() => setIsReducedMotion(!isReducedMotion)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    isReducedMotion
                      ? "bg-amber-500/20 text-amber-400 font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  )}
                  title="Simulasikan prefers-reduced-motion"
                >
                  <span>Motion: {isReducedMotion ? "Off" : "On"}</span>
                </button>

                {/* Viewport Mode Switcher */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "phone" ? "fullscreen" : "phone")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    viewMode === "fullscreen"
                      ? "bg-accent/20 text-accent font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  )}
                  title="Toggle Phone Simulator vs Wide Responsive Canvas"
                  aria-label="Toggle Mode Tampilan"
                >
                  {viewMode === "phone" ? <DeviceMobile size={14} /> : <Desktop size={14} />}
                  <span>{viewMode === "phone" ? "Phone" : "Wide"}</span>
                </button>

                {/* Simulated Device Theme */}
                <button
                  type="button"
                  onClick={() => setSimulatedTheme(simulatedTheme === "dark" ? "light" : "dark")}
                  className="flex size-7 items-center justify-center rounded text-text-muted hover:text-text-primary transition-colors"
                  title="Ganti tema simulator ponsel (Dark/Light)"
                  aria-label="Toggle tema simulator"
                >
                  {simulatedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
            </div>

            {/* PHONE / VIEWPORT SIMULATOR FRAME */}
            <div
              className={cn(
                "relative flex flex-col overflow-hidden transition-all duration-300 shadow-2xl ring-1 ring-border-subtle",
                viewMode === "phone"
                  ? "h-[760px] w-full max-w-[390px] rounded-[48px] border-[6px] border-neutral-800"
                  : "h-[760px] w-full max-w-2xl rounded-2xl border-2 border-border-default",
                simulatedTheme === "light" ? "light bg-neutral-50 text-neutral-900" : "dark bg-neutral-950 text-neutral-100"
              )}
            >
              {/* Dynamic Notch / Island */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex justify-center pt-2">
                <div className="h-5 w-28 rounded-full bg-black ring-1 ring-neutral-800 flex items-center justify-center">
                  <div className="size-2 rounded-full bg-neutral-900 ring-1 ring-neutral-800 mr-2" />
                  <div className="size-2.5 rounded-full bg-neutral-900 ring-1 ring-neutral-800" />
                </div>
              </div>

              {/* Status Bar */}
              <div className="pointer-events-none absolute top-2 left-0 right-0 z-20 flex items-center justify-between px-7 text-[11px] font-medium opacity-80">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono">5G</span>
                  <div className="h-2.5 w-5 rounded-xs border border-current p-0.5">
                    <div className="h-full w-3 bg-current rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Simulated Yomirra App Viewport (Scrollable Content) */}
              <div className="flex-1 overflow-y-auto px-4 pt-14 pb-28 scrollbar-none">
                {/* Header Mock */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Yomirra Library</h2>
                    <p className="text-xs opacity-60">Lanjut baca manga favoritmu</p>
                  </div>
                  <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    YR
                  </div>
                </div>

                {/* Continue Reading Card */}
                <div className="mb-6 rounded-2xl border border-border-subtle/40 bg-surface-raised/40 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-accent mb-2">
                    <ClockCounterClockwise size={14} />
                    <span>Terakhir Dibaca</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-20 w-14 shrink-0 rounded-lg bg-neutral-800 overflow-hidden relative border border-border-subtle">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1">
                        <span className="text-[9px] font-bold text-white">Ch. 248</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">Jujutsu Kaisen</h3>
                      <p className="text-xs opacity-60 mt-0.5">Halaman 14 dari 19</p>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-accent" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manga Grid Simulation */}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Rekomendasi Update</h3>
                  <span className="text-[11px] text-accent">Lihat Semua</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: "Chainsaw Man", ch: "Ch. 172", tag: "Shonen" },
                    { title: "Frieren: Beyond Journey", ch: "Ch. 131", tag: "Fantasy" },
                    { title: "One Piece", ch: "Ch. 1124", tag: "Adventure" },
                    { title: "Solo Leveling: Ragnarok", ch: "Ch. 18", tag: "Action" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex flex-col rounded-xl border border-border-subtle/40 bg-surface-raised/30 p-2.5 transition-colors"
                    >
                      <div className="mb-2 h-28 w-full rounded-lg bg-neutral-800/80 relative overflow-hidden flex items-center justify-center border border-border-subtle/50">
                        <BookOpenText size={24} className="opacity-20" />
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-mono font-medium text-white">
                          {item.ch}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                      <span className="text-[10px] opacity-60">{item.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LIVE DOCK CONTAINER AT BOTTOM OF SIMULATOR */}
              <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
                <ActiveDockComponent
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  safeAreaBottom={safeAreaBottom}
                  showTargetOverlay={showTargetOverlay}
                  isReducedMotion={isReducedMotion}
                />
              </div>

              {/* iOS Home Indicator Bar Simulation */}
              {safeAreaBottom >= 20 && (
                <div className="pointer-events-none absolute bottom-1 left-0 right-0 z-40 flex justify-center pb-1">
                  <div className="h-1 w-32 rounded-full bg-neutral-400/40" />
                </div>
              )}
            </div>

            {/* Simulator Hint */}
            <p className="mt-3 text-center text-xs text-text-muted">
              Coba klik tab pada dock di atas untuk menguji respon interaksi & animasinya secara langsung.
            </p>
          </section>

          {/* RIGHT COLUMN: Architectural Specs, Analysis & Evaluation Matrix (lg:col-span-5) */}
          <section className="flex flex-col gap-6 lg:col-span-5">
            
            {/* Active Variant Deep Dive Card */}
            <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    {currentVariant.tag}
                  </span>
                  <h2 className="mt-2 text-xl font-bold tracking-tight">
                    {currentVariant.title}
                  </h2>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    Archetype: {currentVariant.archetype}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-text-muted">Reachability</span>
                  <span className="text-lg font-black text-emerald-400">
                    {currentVariant.reachability}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                {currentVariant.description}
              </p>

              {/* Metrics Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border-subtle py-3 text-xs">
                <div>
                  <span className="text-text-muted block text-[11px]">Tinggi Footprint:</span>
                  <span className="font-semibold">{currentVariant.height}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Motion Complexity:</span>
                  <span className="font-semibold">{currentVariant.motionLevel}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Touch Target Minimum:</span>
                  <span className="font-semibold text-emerald-400">44 x 44 px (WCAG 2.1)</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Safe Area Resilience:</span>
                  <span className="font-semibold">Dynamic CSS Padding</span>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle size={14} weight="fill" />
                    Kelebihan Arsitektural:
                  </h4>
                  <ul className="space-y-1">
                    {currentVariant.pros.map((p, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0 mt-0.5">&bull;</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <WarningCircle size={14} weight="fill" />
                    Trade-off / Pertimbangan:
                  </h4>
                  <ul className="space-y-1">
                    {currentVariant.cons.map((c, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0 mt-0.5">&bull;</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Switcher List */}
            <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-sm">
              <h3 className="text-sm font-bold tracking-tight mb-3 flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Daftar 10 Varian
              </h3>
              <div className="divide-y divide-border-subtle text-xs">
                {VARIANTS.map((v) => {
                  const isSelected = v.id === selectedVariantId
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        "w-full py-2.5 px-2 flex items-center justify-between text-left transition-colors rounded-lg",
                        isSelected ? "bg-accent/10 text-accent font-semibold" : "hover:bg-surface-hover text-text-secondary"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] opacity-60">#{v.id.toString().padStart(2, "0")}</span>
                        <span className="truncate">{v.codename}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] opacity-60 font-mono">{v.archetype.split(" ")[0]}</span>
                        <CaretRight size={12} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Review Note */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-300">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Info size={16} weight="fill" />
                Catatan Evaluasi Reviewer
              </div>
              <p className="leading-relaxed opacity-90">
                Pilih varian yang paling nyaman menurut preferensi Anda. Setelah varian terpilih dikonfirmasi, dock utama Yomirra di <code className="rounded bg-black/30 px-1 py-0.5">bottom-dock.tsx</code> baru akan di-update dengan transisi mulus dan backward-compatibility penuh.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
