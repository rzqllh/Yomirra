"use client";

import * as React from "react";
import Link from "next/link";
import { 
  CheckCircle, 
  WarningCircle, 
  Info, 
  X, 
  Sparkle, 
  ArrowClockwise, 
  Play, 
  Square, 
  SlidersHorizontal, 
  CaretLeft, 
  BookmarkSimple, 
  ArrowUUpLeft,
  BellRinging,
  Gauge,
  Flame,
  PushPin
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Transition } from "motion/react";
import { cn } from "@/shared/utils/cn";

// Toast Type definition
type ToastType = "success" | "error" | "info" | "neutral" | "action";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  timestamp?: string;
}

// 10 Distinct Toast Designs
const TOAST_DESIGNS = [
  { 
    id: 1, 
    shortName: "Dynamic Island", 
    fullName: "1. Dynamic Island Liquid Glass", 
    tag: "Apple Pill × Liquid Glass", 
    desc: "Kapsul obsidian melayang dengan refraksi Liquid Glass pekat, specular rim highlight ganda, dan micro-indicator adaptif." 
  },
  { id: 2, shortName: "Squircle Glass", fullName: "2. Signature Squircle Glass", tag: "Yomirra Native", desc: "Frosted obsidian glass, border rambut 1px, geometri squircle konsentris 14px." },
  { id: 3, shortName: "Linear Monolith", fullName: "3. Linear Monolith HUD", tag: "Developer Stealth", desc: "Monokrom gelap pekat, tipografi monospaced untuk meta, aksen sudut semantik." },
  { id: 4, shortName: "Bento Dock", fullName: "4. Bento Micro-Dock", tag: "Modular Control", desc: "Grid dua kolom: squircle badge icon di kiri, teks dan micro-action di kanan." },
  { id: 5, shortName: "Aura Glow", fullName: "5. Aura Border Glow", tag: "Living Edge", desc: "Surface hitam gelap dengan border pendaran neon hidup mengikuti jenis status." },
  { id: 6, shortName: "Paper Notch", fullName: "6. Editorial Paper Notch", tag: "Quiet Reader", desc: "Garis warna vertikal 3px di tepi kiri, tenang dan tidak mengganggu perendaman visual komik." },
  { id: 7, shortName: "Frosted Glass", fullName: "7. Spatial Frosted Sheet", tag: "Glassmorphism", desc: "Backdrop-blur 3xl pekat, bias cahaya tepi, refleksi kaca ganda melayang." },
  { id: 8, shortName: "Progress Ribbon", fullName: "8. Progress Ribbon Stream", tag: "Countdown Track", desc: "Strip horizontal minimalis dengan progress bar waktu countdown terpasang di bawah." },
  { id: 9, shortName: "Action Pill", fullName: "9. Action-First Pill", tag: "Thumb Ergonomics", desc: "Dirancang untuk jempol satu tangan, tombol aksi langsung terlihat kontras di sisi kanan." },
  { id: 10, shortName: "Haptic Stack", fullName: "10. Haptic Card Stack", tag: "Layered Depth", desc: "Efek kartu berlapis 3D dengan bayangan fisik bertingkat untuk riwayat notifikasi." }
];

// 10 Distinct Entrance & Exit Transitions
const TOAST_TRANSITIONS = [
  { 
    id: 1, 
    shortName: "Notch Morph",
    fullName: "1. iOS Spring Notch Morph", 
    type: "Aperture Physics", 
    desc: "Mengembang keluar dari aperture Dynamic Island / Notch dengan kurva Apple Spring (stiffness: 420, damping: 28) dan tersedot kembali ke lubang kamera.",
    inVariants: { 
      initial: { opacity: 0, scaleX: 0.35, scaleY: 0.28, y: -10, filter: "blur(4px)" }, 
      animate: { opacity: 1, scaleX: 1, scaleY: 1, y: 0, filter: "blur(0px)" }, 
      exit: { opacity: 0, scaleX: 0.35, scaleY: 0.25, y: -10, filter: "blur(2px)" } 
    },
    transition: (slow: boolean): Transition => ({ 
      type: "spring", 
      stiffness: slow ? 85 : 420, 
      damping: slow ? 15 : 28, 
      mass: 0.8 
    })
  },
  { 
    id: 2, 
    shortName: "Droplet Stretch",
    fullName: "2. Liquid Droplet Stretch", 
    type: "Fluid Morph", 
    desc: "Menetes dari status bar dengan peregangan vertikal (scaleY: 1.25 -> 1.0) seperti cairan.",
    inVariants: { initial: { opacity: 0, y: -45, scaleY: 1.3, scaleX: 0.9 }, animate: { opacity: 1, y: 0, scaleY: 1, scaleX: 1 }, exit: { opacity: 0, y: -30, scaleY: 0.8 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.6 : 0.45, ease: [0.19, 1, 0.22, 1] })
  },
  { 
    id: 3, 
    shortName: "Focus Blur",
    fullName: "3. Cinematic Focus Blur", 
    type: "Optical Lens", 
    desc: "Bahan melayang memfokus dari blur 14px ke jernih, keluar larut kembali ke latar belakang.",
    inVariants: { initial: { opacity: 0, y: -16, filter: "blur(14px)", scale: 0.96 }, animate: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }, exit: { opacity: 0, filter: "blur(10px)", scale: 0.96 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.5 : 0.35, ease: [0.16, 1, 0.3, 1] })
  },
  { 
    id: 4, 
    shortName: "Linear Slide",
    fullName: "4. Linear Smooth Slide", 
    type: "Cubic Ease", 
    desc: "Pergerakan murni vertikal terkalibrasi tanpa pantulan (ease: [0.16, 1, 0.3, 1]), presisi studio.",
    inVariants: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -24 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.4 : 0.32, ease: [0.16, 1, 0.3, 1] })
  },
  { 
    id: 5, 
    shortName: "Magnetic Drop",
    fullName: "5. Magnetic Gravity Drop", 
    type: "Heavy Anchor", 
    desc: "Jatuh cepat sedikit melampaui posisi lalu tertarik magnet ke atas secara mantap.",
    inVariants: { initial: { opacity: 0, y: -60, scale: 0.92 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -40, scale: 0.9 } },
    transition: (slow: boolean): Transition => ({ type: "spring", stiffness: slow ? 60 : 450, damping: slow ? 12 : 20, mass: 1.2 })
  },
  { 
    id: 6, 
    shortName: "Expand Dot",
    fullName: "6. Expand from Dot", 
    type: "Morph", 
    desc: "Berasal dari titik 8px di tengah atas yang seketika mengembang horizontal dan vertikal.",
    inVariants: { initial: { opacity: 0, scaleX: 0.15, scaleY: 0.15, y: -20 }, animate: { opacity: 1, scaleX: 1, scaleY: 1, y: 0 }, exit: { opacity: 0, scaleX: 0.2, scaleY: 0.2, y: -15 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.6 : 0.38, ease: [0.34, 1.56, 0.64, 1] })
  },
  { 
    id: 7, 
    shortName: "3D Flip",
    fullName: "7. 3D Perspective Flip", 
    type: "3D Tumble", 
    desc: "Berotasi 65 derajat dari langit-langit (rotateX) dengan perspektif tiga dimensi.",
    inVariants: { initial: { opacity: 0, rotateX: 65, y: -35, transformPerspective: 800 }, animate: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 800 }, exit: { opacity: 0, rotateX: -45, y: -25, transformPerspective: 800 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.8 : 0.42, ease: [0.22, 1, 0.36, 1] })
  },
  { 
    id: 8, 
    shortName: "Curtain Shutter",
    fullName: "8. Curtain Shutter Reveal", 
    type: "Clip Path", 
    desc: "Tersibak dari atas ke bawah seperti tirai penutup kamera yang membuka bersih.",
    inVariants: { initial: { opacity: 0, clipPath: "inset(0 0 100% 0)", y: -12 }, animate: { opacity: 1, clipPath: "inset(0 0 0% 0)", y: 0 }, exit: { opacity: 0, clipPath: "inset(0 0 100% 0)", y: -10 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.5 : 0.36, ease: [0.16, 1, 0.3, 1] })
  },
  { 
    id: 9, 
    shortName: "Side Swipe",
    fullName: "9. Side Swipe Flow", 
    type: "Glance", 
    desc: "Masuk dengan sedikit sudut kemiringan rotasi (-3deg) dan keluar disapu ke kanan.",
    inVariants: { initial: { opacity: 0, x: 25, y: -20, rotate: -3 }, animate: { opacity: 1, x: 0, y: 0, rotate: 0 }, exit: { opacity: 0, x: 60, y: -5, rotate: 4 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.5 : 0.34, ease: [0.25, 1, 0.5, 1] })
  },
  { 
    id: 10, 
    shortName: "Zen Dissolve",
    fullName: "10. Zen Soft Dissolve", 
    type: "Fade", 
    desc: "Pergeseran halus 6px dengan larut transparan ultra-cepat, dirancang khusus saat membaca komik.",
    inVariants: { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } },
    transition: (slow: boolean): Transition => ({ duration: slow ? 1.2 : 0.22, ease: "easeOut" })
  }
];

export default function ToastDemoPage() {
  // Master state
  const [activeTab, setActiveTab] = React.useState<"design" | "transition">("design");
  const [selectedDesign, setSelectedDesign] = React.useState<number>(1); // Default: Dynamic Island Liquid Glass
  const [selectedTransition, setSelectedTransition] = React.useState<number>(1); // Default: iOS Spring Notch Morph
  const [toastType, setToastType] = React.useState<ToastType>("success");
  
  // Motion interactive states
  const [isSlowMo, setIsSlowMo] = React.useState<boolean>(false);
  const [isToastVisible, setIsToastVisible] = React.useState<boolean>(true);
  const [isPinned, setIsPinned] = React.useState<boolean>(false);
  const [autoDismissTimer, setAutoDismissTimer] = React.useState<NodeJS.Timeout | null>(null);

  // Active toast mock data
  const currentToastData: ToastData = React.useMemo(() => {
    switch (toastType) {
      case "success":
        return {
          id: "toast-success",
          type: "success",
          title: "Chapter 42 Tersimpan",
          description: "45 halaman berhasil diunduh untuk dibaca offline.",
          timestamp: "Baru saja"
        };
      case "error":
        return {
          id: "toast-error",
          type: "error",
          title: "Gagal Menghubungkan Sumber",
          description: "Server Shinigami sedang tidak merespons. Coba lagi nanti.",
          timestamp: "10:52"
        };
      case "info":
        return {
          id: "toast-info",
          type: "info",
          title: "Melanjutkan Bacaan...",
          description: "Kembali ke posisi halaman 28 di Bab 14.",
          timestamp: "Sekarang"
        };
      case "action":
        return {
          id: "toast-action",
          type: "action",
          title: "Dihapus dari Bookmark",
          description: "Solo Leveling telah dikeluarkan dari koleksi bacaan.",
          actionLabel: "Urungkan",
          onAction: () => alert("Aksi diurungkan!"),
          timestamp: "1 dtk"
        };
      case "neutral":
      default:
        return {
          id: "toast-neutral",
          type: "neutral",
          title: "Mode Gelap Otomatis Aktif",
          description: "Menyesuaikan preferensi sistem perangkat Anda.",
          timestamp: "Info"
        };
    }
  }, [toastType]);

  // Trigger Toast function
  const triggerToast = React.useCallback((type?: ToastType) => {
    if (type) setToastType(type);
    setIsToastVisible(false);
    
    if (autoDismissTimer) clearTimeout(autoDismissTimer);

    setTimeout(() => {
      setIsToastVisible(true);
      if (!isPinned) {
        const timer = setTimeout(() => {
          setIsToastVisible(false);
        }, isSlowMo ? 7000 : 3500);
        setAutoDismissTimer(timer);
      }
    }, 60);
  }, [isPinned, isSlowMo, autoDismissTimer]);

  const handleManualIn = () => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    setIsToastVisible(true);
  };

  const handleManualOut = () => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    setIsToastVisible(false);
  };

  // Render Toast Body based on Design ID
  const renderToastContent = (designId: number, data: ToastData) => {
    const isSuccess = data.type === "success";
    const isError = data.type === "error";
    const isInfo = data.type === "info";
    const isAction = data.type === "action";

    // Design 1: Dynamic Island Capsule mix Liquid Glass (Apple Fluid Pill)
    if (designId === 1) {
      return (
        <div className="relative overflow-hidden flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/85 backdrop-blur-2xl text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.5),0_16px_36px_rgba(0,0,0,0.85)] max-w-[340px] w-full">
          {/* Liquid Glass Specular Rim & Glare Sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-transparent pointer-events-none rounded-full" />
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {/* Staggered Content inside Dynamic Island */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, filter: "blur(3px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(2px)" }}
            transition={{ duration: isSlowMo ? 0.6 : 0.18, delay: isSlowMo ? 0.2 : 0.05 }}
            className="flex items-center gap-2.5 w-full min-w-0 z-10"
          >
            <div className={cn(
              "size-6 rounded-full flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/10",
              isSuccess && "bg-semantic-success/20 text-semantic-success",
              isError && "bg-semantic-error/20 text-semantic-error",
              isInfo && "bg-accent/20 text-accent",
              isAction && "bg-semantic-warning/20 text-semantic-warning",
              data.type === "neutral" && "bg-white/10 text-white"
            )}>
              {isSuccess && <CheckCircle size={14} weight="fill" />}
              {isError && <WarningCircle size={14} weight="fill" />}
              {isInfo && <BookmarkSimple size={14} weight="fill" />}
              {isAction && <ArrowUUpLeft size={14} weight="bold" />}
              {data.type === "neutral" && <Sparkle size={14} weight="fill" />}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-bold leading-none truncate text-white">{data.title}</p>
              {data.description && <p className="text-[10px] text-white/60 truncate mt-0.5 font-medium">{data.description}</p>}
            </div>
            {data.actionLabel && (
              <button 
                onClick={data.onAction}
                className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold shrink-0 transition-all active:scale-95 border border-white/20 shadow-xs cursor-pointer"
              >
                {data.actionLabel}
              </button>
            )}
          </motion.div>
        </div>
      );
    }

    // Design 2: Signature Squircle Glass (Yomirra Native)
    if (designId === 2) {
      return (
        <div className="flex items-start gap-2.5 p-3 rounded-[14px] bg-zinc-950/90 backdrop-blur-2xl text-white border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.85)] max-w-[340px] w-full">
          <div className={cn(
            "size-7 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.08]",
            isSuccess && "bg-semantic-success/15 text-semantic-success border-semantic-success/30",
            isError && "bg-semantic-error/15 text-semantic-error border-semantic-error/30",
            isInfo && "bg-accent/15 text-accent border-accent/30",
            isAction && "bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30",
            data.type === "neutral" && "bg-white/5 text-white/80"
          )}>
            {isSuccess && <CheckCircle size={15} weight="bold" />}
            {isError && <WarningCircle size={15} weight="bold" />}
            {isInfo && <BookmarkSimple size={15} weight="bold" />}
            {isAction && <ArrowUUpLeft size={15} weight="bold" />}
            {data.type === "neutral" && <Sparkle size={15} weight="bold" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="text-xs font-bold text-white leading-snug truncate">{data.title}</h4>
              <span className="text-[10px] font-mono text-white/40 shrink-0">{data.timestamp}</span>
            </div>
            {data.description && (
              <p className="text-[10px] text-white/60 leading-relaxed mt-0.5 line-clamp-1">
                {data.description}
              </p>
            )}
          </div>
          {data.actionLabel && (
            <Button 
              size="sm" 
              onClick={data.onAction}
              className="h-6 px-2 rounded-[6px] text-[10px] font-bold shrink-0 self-center"
            >
              {data.actionLabel}
            </Button>
          )}
        </div>
      );
    }

    // Design 3: Linear Monolith HUD (Developer Stealth)
    if (designId === 3) {
      return (
        <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-lg bg-zinc-950 text-white border border-zinc-800 shadow-2xl max-w-[340px] w-full font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "size-2 rounded-full shrink-0 animate-pulse",
              isSuccess && "bg-emerald-400",
              isError && "bg-rose-500",
              isInfo && "bg-indigo-400",
              isAction && "bg-amber-400",
              data.type === "neutral" && "bg-zinc-400"
            )} />
            <span className="text-xs text-zinc-100 font-medium truncate">{data.title}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {data.actionLabel ? (
              <button 
                onClick={data.onAction}
                className="text-[10px] text-accent hover:underline font-bold"
              >
                [{data.actionLabel}]
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500">{data.timestamp}</span>
            )}
          </div>
        </div>
      );
    }

    // Design 4: Bento Micro-Dock (Modular Control)
    if (designId === 4) {
      return (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/60 backdrop-blur-xl shadow-xl max-w-[340px] w-full text-white">
          <div className={cn(
            "size-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-xs",
            isSuccess && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            isError && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
            isInfo && "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
            isAction && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
            data.type === "neutral" && "bg-white/10 text-white"
          )}>
            {isSuccess && <CheckCircle size={16} weight="duotone" />}
            {isError && <WarningCircle size={16} weight="duotone" />}
            {isInfo && <BookmarkSimple size={16} weight="duotone" />}
            {isAction && <ArrowUUpLeft size={16} weight="bold" />}
            {data.type === "neutral" && <Sparkle size={16} weight="duotone" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-snug truncate text-white">{data.title}</p>
            {data.description && <p className="text-[10px] text-white/50 truncate mt-0.5">{data.description}</p>}
          </div>
          {data.actionLabel ? (
            <button 
              onClick={data.onAction}
              className="h-7 px-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {data.actionLabel}
            </button>
          ) : (
            <button onClick={() => setIsToastVisible(false)} className="size-6 rounded-md text-white/40 hover:text-white flex items-center justify-center">
              <X size={13} />
            </button>
          )}
        </div>
      );
    }

    // Design 5: Aura Border Glow (Cyber/Living Edge)
    if (designId === 5) {
      return (
        <div className={cn(
          "relative rounded-[14px] p-[1px] max-w-[340px] w-full overflow-hidden shadow-2xl",
          isSuccess && "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
          isError && "bg-gradient-to-r from-rose-500 via-red-400 to-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
          isInfo && "bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.25)]",
          isAction && "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
          data.type === "neutral" && "bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600 shadow-[0_0_16px_rgba(255,255,255,0.08)]"
        )}>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-[13px] bg-black/95 text-white backdrop-blur-xl">
            <span className={cn(
              "size-2 rounded-full shrink-0 animate-ping",
              isSuccess && "bg-emerald-400",
              isError && "bg-rose-400",
              isInfo && "bg-indigo-400",
              isAction && "bg-amber-400",
              data.type === "neutral" && "bg-zinc-400"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{data.title}</p>
              {data.description && <p className="text-[10px] text-white/60 truncate">{data.description}</p>}
            </div>
            {data.actionLabel && (
              <button onClick={data.onAction} className="text-xs font-bold text-accent hover:underline">
                {data.actionLabel}
              </button>
            )}
          </div>
        </div>
      );
    }

    // Design 6: Editorial Paper Notch (Quiet Reader)
    if (designId === 6) {
      return (
        <div className="flex items-stretch rounded-lg bg-zinc-950/95 border border-zinc-800 text-white shadow-xl max-w-[340px] w-full overflow-hidden">
          <div className={cn(
            "w-1.5 shrink-0",
            isSuccess && "bg-semantic-success",
            isError && "bg-semantic-error",
            isInfo && "bg-accent",
            isAction && "bg-semantic-warning",
            data.type === "neutral" && "bg-zinc-500"
          )} />
          <div className="flex-1 p-2.5 flex items-center justify-between gap-2.5 min-w-0">
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight text-white/90 truncate">{data.title}</p>
              {data.description && <p className="text-[10px] text-white/50 truncate mt-0.5">{data.description}</p>}
            </div>
            {data.actionLabel ? (
              <button onClick={data.onAction} className="text-xs font-semibold text-accent shrink-0">
                {data.actionLabel}
              </button>
            ) : (
              <span className="text-[10px] text-white/30 font-mono shrink-0">{data.timestamp}</span>
            )}
          </div>
        </div>
      );
    }

    // Design 7: Spatial Frosted Sheet (High Glassmorphism)
    if (designId === 7) {
      return (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.08] border border-white/20 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-white max-w-[340px] w-full ring-1 ring-black/40">
          <div className={cn(
            "size-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner",
            isSuccess && "bg-semantic-success/25 text-semantic-success",
            isError && "bg-semantic-error/25 text-semantic-error",
            isInfo && "bg-accent/25 text-accent",
            isAction && "bg-semantic-warning/25 text-semantic-warning",
            data.type === "neutral" && "bg-white/10 text-white"
          )}>
            {isSuccess && <CheckCircle size={16} weight="fill" />}
            {isError && <WarningCircle size={16} weight="fill" />}
            {isInfo && <BookmarkSimple size={16} weight="fill" />}
            {isAction && <ArrowUUpLeft size={16} weight="bold" />}
            {data.type === "neutral" && <Sparkle size={16} weight="fill" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white drop-shadow-xs truncate">{data.title}</p>
            {data.description && <p className="text-[10px] text-white/70 truncate">{data.description}</p>}
          </div>
          {data.actionLabel && (
            <Button size="sm" onClick={data.onAction} className="h-6 px-2.5 rounded-md text-[10px] font-bold shrink-0">
              {data.actionLabel}
            </Button>
          )}
        </div>
      );
    }

    // Design 8: Progress Ribbon Stream (Countdown Track)
    if (designId === 8) {
      return (
        <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl max-w-[340px] w-full overflow-hidden text-white">
          <div className="flex items-center justify-between gap-2.5 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "size-2 rounded-full shrink-0",
                isSuccess && "bg-semantic-success",
                isError && "bg-semantic-error",
                isInfo && "bg-accent",
                isAction && "bg-semantic-warning",
                data.type === "neutral" && "bg-white/60"
              )} />
              <p className="text-xs font-semibold text-white/90 truncate">{data.title}</p>
            </div>
            {data.actionLabel && (
              <button onClick={data.onAction} className="text-xs font-bold text-accent shrink-0">
                {data.actionLabel}
              </button>
            )}
          </div>
          {/* Simulated countdown bar */}
          <div className="h-[2px] w-full bg-white/10">
            <motion.div 
              initial={{ width: "100%" }} 
              animate={{ width: "0%" }} 
              transition={{ duration: isSlowMo ? 7 : 3.5, ease: "linear" }}
              className={cn(
                "h-full",
                isSuccess && "bg-semantic-success",
                isError && "bg-semantic-error",
                isInfo && "bg-accent",
                isAction && "bg-semantic-warning",
                data.type === "neutral" && "bg-white/80"
              )}
            />
          </div>
        </div>
      );
    }

    // Design 9: Action-First Pill (Thumb Ergonomics)
    if (designId === 9) {
      return (
        <div className="flex items-center justify-between gap-2 pl-3.5 pr-1.5 py-1 rounded-full bg-zinc-900 border border-zinc-700/80 text-white shadow-2xl max-w-[340px] w-full">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{data.title}</p>
          </div>
          <button 
            onClick={data.actionLabel ? data.onAction : () => setIsToastVisible(false)}
            className="h-7 px-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold shrink-0 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {data.actionLabel || "Tutup"}
          </button>
        </div>
      );
    }

    // Design 10: Haptic Card Stack (Layered Depth)
    if (designId === 10) {
      return (
        <div className="relative max-w-[340px] w-full select-none">
          <div className="absolute -bottom-1 left-2 right-2 h-3 rounded-[12px] bg-zinc-900 border border-white/5 opacity-70 -z-10" />
          <div className="flex items-center gap-2.5 p-3 rounded-[14px] bg-zinc-950/95 border border-white/10 backdrop-blur-xl text-white shadow-[0_12px_36px_rgba(0,0,0,0.9)]">
            <div className={cn(
              "size-7 rounded-[8px] flex items-center justify-center shrink-0",
              isSuccess && "bg-semantic-success/20 text-semantic-success",
              isError && "bg-semantic-error/20 text-semantic-error",
              isInfo && "bg-accent/20 text-accent",
              isAction && "bg-semantic-warning/20 text-semantic-warning",
              data.type === "neutral" && "bg-white/10 text-white"
            )}>
              {isSuccess && <CheckCircle size={16} weight="bold" />}
              {isError && <WarningCircle size={16} weight="bold" />}
              {isInfo && <BookmarkSimple size={16} weight="bold" />}
              {isAction && <ArrowUUpLeft size={16} weight="bold" />}
              {data.type === "neutral" && <Sparkle size={16} weight="bold" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{data.title}</p>
              {data.description && <p className="text-[10px] text-white/50 truncate">{data.description}</p>}
            </div>
            {data.actionLabel && (
              <Button size="sm" onClick={data.onAction} className="h-6 px-2 rounded-[6px] text-[10px] font-bold shrink-0">
                {data.actionLabel}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const activeTransitionObj = TOAST_TRANSITIONS.find(t => t.id === selectedTransition) || TOAST_TRANSITIONS[0];

  return (
    <div className="min-h-screen bg-black text-text-primary pb-32">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link 
              href="/showcase" 
              className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white border border-white/10 transition-colors shrink-0"
              aria-label="Kembali ke Showcase"
            >
              <CaretLeft size={16} weight="bold" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <BellRinging size={15} weight="duotone" className="text-accent shrink-0" />
                Toast Revamp Lab
              </h1>
              <p className="text-[10px] text-white/40 truncate">10 Desain & 10 Transisi Masuk/Keluar</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs shrink-0">
            <button
              onClick={() => setActiveTab("design")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "design" ? "bg-accent text-white shadow-xs" : "text-white/50 hover:text-white"
              )}
            >
              Desain (10)
            </button>
            <button
              onClick={() => setActiveTab("transition")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "transition" ? "bg-accent text-white shadow-xs" : "text-white/50 hover:text-white"
              )}
            >
              Transisi (10)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 mt-3 space-y-4">

        {/* 1. STICKY / PROMINENT LIVE VIEWPORT STAGE */}
        <section aria-label="Simulasi Toast Langsung" className="w-full">
          <div className="relative w-full h-[180px] sm:h-[200px] rounded-2xl bg-zinc-950 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between p-3 select-none">
            
            {/* Background Manga Canvas simulation */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black pointer-events-none -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(108,106,250,0.12),transparent_70%)] pointer-events-none -z-10" />

            {/* Authentic Stage Status Bar (Flanked Left/Right) */}
            <div className="flex items-center justify-between text-[11px] px-1 pb-1 z-20 select-none">
              <div className="flex items-center gap-1.5 font-bold text-white/75 tracking-tight">
                <span>9:41</span>
                <span className="size-1.5 rounded-full bg-semantic-success" />
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/50">
                <span className="text-[9px]">5G</span>
                <div className="w-4 h-2 rounded-[2px] border border-white/40 p-[1px] flex items-center">
                  <div className="h-full w-full bg-white/80 rounded-[0.5px]" />
                </div>
              </div>
            </div>

            {/* Hardware Dynamic Island Cutout Aperture */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-25 flex items-center justify-center pointer-events-none">
              <div className={cn(
                "h-[26px] rounded-full bg-black border border-white/15 shadow-inner flex items-center justify-between px-2.5 transition-all duration-300 select-none",
                isToastVisible && selectedTransition === 1 ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100 w-[114px]"
              )}>
                {/* Front camera lens reflection */}
                <div className="size-2.5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
                  <div className="size-1 rounded-full bg-indigo-900/60" />
                </div>
                {/* Micro FaceID sensor dot */}
                <div className="size-1.5 rounded-full bg-zinc-900 border border-zinc-800/80" />
              </div>
            </div>

            {/* Floating Toast Slot */}
            <div className="absolute top-2 left-0 right-0 px-3 z-30 flex justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {isToastVisible && (
                  <motion.div
                    key={`${selectedDesign}-${selectedTransition}-${toastType}-${isToastVisible ? 'visible' : 'hidden'}`}
                    variants={activeTransitionObj.inVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={activeTransitionObj.transition(isSlowMo)}
                    style={{ transformOrigin: "top center" }}
                    className="pointer-events-auto w-full flex justify-center origin-top"
                  >
                    {renderToastContent(selectedDesign, currentToastData)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stage Backdrop Watermark */}
            <div className="text-center my-auto pt-6 text-white/20 font-mono text-[11px] pointer-events-none">
              Panel Manga Aktif • Halaman 44
            </div>

            {/* Quick Stage Controls Bar */}
            <div className="flex items-center justify-between gap-2 z-20 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => triggerToast()}
                  className="h-7 px-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <ArrowClockwise size={13} weight="bold" />
                  <span>Re-trigger</span>
                </button>

                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn(
                    "h-7 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors",
                    isPinned 
                      ? "bg-white text-black border-white font-bold" 
                      : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                  )}
                >
                  <PushPin size={12} weight={isPinned ? "fill" : "regular"} />
                  <span>{isPinned ? "Pinned" : "Pin"}</span>
                </button>

                {isSlowMo && (
                  <span className="px-2 py-0.5 rounded-md bg-semantic-warning/20 border border-semantic-warning/30 text-semantic-warning text-[10px] font-bold font-mono">
                    0.2x Slow-Mo
                  </span>
                )}
              </div>

              {activeTab === "transition" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleManualIn}
                    className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 flex items-center gap-1"
                  >
                    <Play size={11} /> In
                  </button>
                  <button
                    onClick={handleManualOut}
                    className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 flex items-center gap-1"
                  >
                    <Square size={11} /> Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* 2. HORIZONTAL SCROLLABLE SELECTION RAIL */}
        <section aria-label="Kontrol Pemilihan">
          {activeTab === "design" ? (
            /* TAB 1: 10 DESAIN (Mobile-First Horizontal Carousel) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-accent" />
                  Pilih Dari 10 Konsep Desain:
                </h2>
                <span className="text-[10px] font-mono text-white/40">Swipe ke samping →</span>
              </div>

              {/* Horizontal Scroll Pill Rail */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {TOAST_DESIGNS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDesign(d.id);
                      triggerToast();
                    }}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer flex flex-col justify-center min-w-[130px]",
                      selectedDesign === d.id
                        ? "bg-accent/20 border-accent text-white shadow-sm ring-1 ring-accent"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <span className="text-xs font-bold whitespace-nowrap">{d.shortName}</span>
                    <span className="text-[10px] font-mono text-accent truncate">{d.tag}</span>
                  </button>
                ))}
              </div>

              {/* Status Type 5-Segment Bar */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-white/50">Tipe Pesan:</span>
                <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
                  {[
                    { id: "success", label: "Sukses", color: "text-semantic-success" },
                    { id: "error", label: "Kendala", color: "text-semantic-error" },
                    { id: "info", label: "Info", color: "text-accent" },
                    { id: "action", label: "Aksi", color: "text-semantic-warning" },
                    { id: "neutral", label: "Netral", color: "text-white/70" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => triggerToast(t.id as ToastType)}
                      className={cn(
                        "py-1.5 rounded-lg border text-center transition-all cursor-pointer text-xs truncate",
                        toastType === t.id 
                          ? "bg-white/15 border-white/30 text-white font-bold shadow-xs" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/50 hover:text-white"
                      )}
                    >
                      <span className={t.color}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: 10 TRANSISI (Mobile-First Horizontal Carousel) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Gauge size={14} className="text-accent" />
                  Pilih Dari 10 Transisi Masuk & Keluar:
                </h2>
                <span className="text-[10px] font-mono text-white/40">Swipe ke samping →</span>
              </div>

              {/* Horizontal Scroll Pill Rail */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {TOAST_TRANSITIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTransition(t.id);
                      triggerToast();
                    }}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer flex flex-col justify-center min-w-[130px]",
                      selectedTransition === t.id
                        ? "bg-accent/20 border-accent text-white shadow-sm ring-1 ring-accent"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <span className="text-xs font-bold whitespace-nowrap">{t.shortName}</span>
                    <span className="text-[10px] font-mono text-accent truncate">{t.type}</span>
                  </button>
                ))}
              </div>

              {/* Slow Motion Scrubber Control */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={16} className={isSlowMo ? "text-semantic-warning" : "text-white/40"} />
                  <div>
                    <p className="text-xs font-bold text-white">Mode Slow-Motion (0.2x)</p>
                    <p className="text-[10px] text-white/40">5x lebih lambat untuk meneliti kurva & fisika</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSlowMo(!isSlowMo)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    isSlowMo ? "bg-semantic-warning text-black" : "bg-white/10 text-white/70 hover:text-white"
                  )}
                >
                  {isSlowMo ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. ACTIVE SPECIFICATION CARD */}
        <section aria-label="Spesifikasi Aktif" className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Sparkle size={14} className="text-accent shrink-0" />
            {activeTab === "design" ? TOAST_DESIGNS[selectedDesign - 1].fullName : TOAST_TRANSITIONS[selectedTransition - 1].fullName}
          </p>
          <p className="text-white/60 leading-relaxed text-[11px]">
            {activeTab === "design" ? TOAST_DESIGNS[selectedDesign - 1].desc : TOAST_TRANSITIONS[selectedTransition - 1].desc}
          </p>
        </section>

      </main>
    </div>
  );
}
