"use client";

import * as React from "react";
import {
  Play,
  BookmarkSimple,
  Star,
  Globe,
  ArrowLeft,
  List,
  MagnifyingGlass,
  SortDescending,
  CaretRight,
  Download,
  ShareNetwork,
  Bell,
  CheckCircle,
  Article,
} from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import type { MangaDetail, Chapter } from "@/shared/types/source";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoProps {
  detail: MangaDetail | null;
  chapters: Chapter[];
  sourceId: string;
  mangaId: string;
  fetchError: string | null;
}

type Variant =
  | "hero-full-width"
  | "card-minimal"
  | "glassmorphism"
  | "manga-panel"
  | "poster-showcase";

type ColorMode = "dark" | "light";

// ─── Static Fallback (if fetch fails) ─────────────────────────────────────────

const FALLBACK: MangaDetail = {
  id: "fallback",
  title: "Cataclysm Hunter",
  coverUrl: "https://placehold.co/300x450/111122/6C6AFA?text=Cover",
  description:
    "Di dunia yang hancur akibat bencana dahsyat, umat manusia terdorong ke ambang kepunahan. Seorang pemburu bangkit untuk menghadapi semua ancaman sendirian.",
  author: "Unknown",
  artist: "Unknown",
  status: "ONGOING",
  format: "Manhwa",
  genres: ["Action", "Fantasy", "Adventure"],
  score: 8.7,
};

const FALLBACK_CHAPTERS: Chapter[] = Array.from({ length: 10 }, (_, i) => ({
  id: `ch-${100 - i}`,
  mangaId: "fallback",
  title: `Chapter ${100 - i}`,
  number: 100 - i,
  date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

// ─── Shared Primitives ────────────────────────────────────────────────────────

function Badge({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider",
        accent
          ? "bg-accent/15 text-accent border border-accent/30"
          : "bg-surface-raised border border-border-subtle text-text-secondary"
      )}
    >
      {children}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-semantic-warning/10 border border-semantic-warning/30 text-semantic-warning">
      <Star weight="fill" size={10} />
      {score > 0 ? score.toFixed(1) : "—"}
    </span>
  );
}

function PrimaryBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button className="w-full flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm rounded-2xl h-12 shadow-lg shadow-accent/20 hover:bg-accent-hover active:scale-[0.98] transition-all">
      {icon}
      {label}
    </button>
  );
}

function ActionRow() {
  return (
    <div className="flex items-center justify-around">
      {[
        { icon: <BookmarkSimple size={20} weight="duotone" />, label: "Simpan" },
        { icon: <Star size={20} weight="duotone" />, label: "Rating" },
        { icon: <ShareNetwork size={20} weight="duotone" />, label: "Bagikan" },
        { icon: <Globe size={20} weight="duotone" />, label: "WebView" },
      ].map((item) => (
        <button
          key={item.label}
          className="flex flex-col items-center gap-1 text-text-secondary hover:text-accent transition-colors py-2 px-3"
        >
          {item.icon}
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ChapterList({ chapters }: { chapters: Chapter[] }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-text-primary">
          {chapters.length} Chapter
        </span>
        <div className="flex items-center gap-2">
          <button className="text-text-secondary hover:text-text-primary transition-colors">
            <SortDescending size={18} />
          </button>
          <button className="text-text-secondary hover:text-text-primary transition-colors">
            <MagnifyingGlass size={18} />
          </button>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border-subtle/50">
        {chapters.slice(0, 6).map((ch) => (
          <div
            key={ch.id}
            className="flex items-center justify-between py-3 group cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                {ch.title}
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">
                {ch.date
                ? new Date(ch.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-text-muted hover:text-text-primary transition-colors">
                <Download size={16} />
              </button>
              <CaretRight size={16} className="text-text-muted" />
            </div>
          </div>
        ))}
        {chapters.length > 6 && (
          <button className="py-3 text-sm font-semibold text-accent text-center hover:text-accent-hover transition-colors">
            Lihat semua {chapters.length} chapter →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Variant 1: Hero Full-Width ───────────────────────────────────────────────

function HeroFullWidth({ detail, chapters }: { detail: MangaDetail; chapters: Chapter[] }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col overflow-y-auto">
      {/* Hero */}
      <div className="relative w-full" style={{ aspectRatio: "3/4", maxHeight: 520 }}>
        <img
          src={detail.coverUrl || ""}
          alt={detail.title}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Layered gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-base/40 to-transparent" />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-5 pb-4">
          <button className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10">
            <ArrowLeft size={18} weight="bold" className="text-white" />
          </button>
          <button className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Bell size={18} weight="duotone" className="text-white" />
          </button>
        </div>
        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <ScoreBadge score={detail.score ?? 0} />
            <Badge>{detail.status}</Badge>
            <Badge accent>{detail.format || "Comic"}</Badge>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg line-clamp-2">
            {detail.title}
          </h1>
          {detail.author && (
            <p className="text-sm text-white/60 mt-1 font-medium">{detail.author}</p>
          )}
        </div>
      </div>
      {/* Content below hero */}
      <div className="flex flex-col gap-5 px-4 pb-8 -mt-2">
        <PrimaryBtn label="Mulai Baca" icon={<Play weight="fill" size={18} />} />
        <ActionRow />
        {/* Synopsis */}
        {detail.description && (
          <div>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
              {detail.description}
            </p>
            <button className="text-xs text-accent font-semibold mt-1">Selengkapnya</button>
          </div>
        )}
        {/* Genres */}
        <div className="flex flex-wrap gap-2">
          {(detail.genres ?? []).map((g) => (
            <Badge key={g}>{g}</Badge>
          ))}
        </div>
        {/* Progress bar */}
        <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle flex items-center gap-3">
          <CheckCircle size={20} weight="duotone" className="text-accent shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-bold text-text-primary">Progress Membaca</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-accent rounded-full" />
              </div>
              <span className="text-[11px] text-text-muted whitespace-nowrap">Ch.{Math.floor(chapters.length / 3)} / {chapters.length}</span>
            </div>
          </div>
        </div>
        {/* Chapters */}
        <ChapterList chapters={chapters} />
      </div>
    </div>
  );
}

// ─── Variant 2: Card Minimal ──────────────────────────────────────────────────

function CardMinimal({ detail, chapters }: { detail: MangaDetail; chapters: Chapter[] }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col overflow-y-auto">
      {/* Minimal top bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border-subtle sticky top-0 bg-surface-base/95 backdrop-blur-md z-10">
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={20} weight="bold" />
        </button>
        <span className="text-sm font-semibold text-text-primary line-clamp-1 flex-1">
          {detail.title}
        </span>
        <button className="text-text-secondary hover:text-text-primary">
          <Bell size={18} weight="duotone" />
        </button>
      </div>
      <div className="flex flex-col gap-6 px-4 pt-6 pb-8">
        {/* Cover + meta row */}
        <div className="flex gap-4">
          <div className="w-24 shrink-0 aspect-[2/3] rounded-lg overflow-hidden border border-border-subtle shadow-md bg-surface-raised">
            <img
              src={detail.coverUrl || ""}
              alt={detail.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
            <h1 className="text-xl font-black text-text-primary leading-tight tracking-tight line-clamp-3">
              {detail.title}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              <ScoreBadge score={detail.score ?? 0} />
              <Badge>{detail.status}</Badge>
              <Badge accent>{detail.format || "Comic"}</Badge>
            </div>
            {detail.author && (
              <p className="text-xs text-text-muted font-medium">{detail.author}</p>
            )}
          </div>
        </div>
        {/* CTA */}
        <PrimaryBtn label="Mulai Baca" icon={<Play weight="fill" size={18} />} />
        {/* Progress bar */}
        <div className="flex items-center gap-3 bg-surface-raised rounded-xl p-3 border border-border-subtle">
          <CheckCircle size={18} weight="duotone" className="text-accent shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-bold text-text-primary">Progress Membaca</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div className="h-full w-2/5 bg-accent rounded-full" />
              </div>
              <span className="text-[11px] text-text-muted whitespace-nowrap">Ch.{Math.floor(chapters.length * 0.4)} / {chapters.length}</span>
            </div>
          </div>
        </div>
        <ActionRow />
        <div className="border-t border-border-subtle" />
        {/* Synopsis */}
        {detail.description && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Sinopsis</span>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
              {detail.description}
            </p>
            <button className="text-xs text-accent font-semibold self-start">Selengkapnya</button>
          </div>
        )}
        {/* Genres */}
        <div className="flex flex-wrap gap-2">
          {(detail.genres ?? []).map((g) => (
            <Badge key={g}>{g}</Badge>
          ))}
        </div>
        <div className="border-t border-border-subtle" />
        <ChapterList chapters={chapters} />
      </div>
    </div>
  );
}

// ─── Variant 3: Glassmorphism ─────────────────────────────────────────────────

function GlassmorphismVariant({ detail, chapters }: { detail: MangaDetail; chapters: Chapter[] }) {
  return (
    <div className="min-h-screen relative text-text-primary flex flex-col overflow-y-auto">
      {/* Tinted blurred background from cover */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={detail.coverUrl || ""}
          alt=""
          className="w-full h-full object-cover opacity-30 blur-3xl scale-110 saturate-200"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-surface-base/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-base/70 to-surface-base/90" />
      </div>
      {/* Content */}
      <div className="relative z-10 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4">
          <button className="w-9 h-9 rounded-full bg-surface-glass backdrop-blur-xl flex items-center justify-center border border-border-glass shadow-glass">
            <ArrowLeft size={18} weight="bold" />
          </button>
          <button className="w-9 h-9 rounded-full bg-surface-glass backdrop-blur-xl flex items-center justify-center border border-border-glass shadow-glass">
            <Bell size={18} weight="duotone" />
          </button>
        </div>
        {/* Glass card with cover */}
        <div className="mx-4 rounded-3xl overflow-hidden border border-border-glass bg-surface-glass backdrop-blur-2xl shadow-glass">
          <div className="flex gap-4 p-4">
            <div className="w-28 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-heavy border border-white/10">
              <img
                src={detail.coverUrl || ""}
                alt={detail.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col justify-end gap-2 flex-1 min-w-0 py-1">
              <div className="flex flex-wrap gap-1.5">
                <ScoreBadge score={detail.score ?? 0} />
                <Badge accent>{detail.format || "Comic"}</Badge>
              </div>
              <h1 className="text-xl font-black text-text-primary leading-tight tracking-tight line-clamp-3">
                {detail.title}
              </h1>
              {detail.author && (
                <p className="text-xs text-text-muted">{detail.author}</p>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="h-px bg-border-glass mx-4" />
          <div className="p-4 flex flex-col gap-3">
            <PrimaryBtn label="Mulai Baca" icon={<Play weight="fill" size={18} />} />
            <ActionRow />
          </div>
        </div>
        {/* Progress card */}
        <div className="mx-4 mt-3 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-glass p-3 flex items-center gap-3">
          <CheckCircle size={20} weight="duotone" className="text-accent shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-bold text-text-primary">Progress Membaca</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-surface-muted/60 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-accent rounded-full" />
              </div>
              <span className="text-[11px] text-text-muted whitespace-nowrap">Ch.{Math.floor(chapters.length / 4)} / {chapters.length}</span>
            </div>
          </div>
        </div>
        {/* Synopsis card */}
        {detail.description && (
          <div className="mx-4 mt-3 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-glass p-4">
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
              {detail.description}
            </p>
            <button className="text-xs text-accent font-semibold mt-2">Selengkapnya</button>
          </div>
        )}
        {/* Genres */}
        <div className="mx-4 mt-3 flex flex-wrap gap-2">
          {(detail.genres ?? []).map((g) => (
            <Badge key={g}>{g}</Badge>
          ))}
        </div>
        {/* Chapter list card */}
        <div className="mx-4 mt-3 mb-8 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-glass p-4">
          <ChapterList chapters={chapters} />
        </div>
      </div>
    </div>
  );
}

// ─── Variant 4: Manga Panel ───────────────────────────────────────────────────

function MangaPanelVariant({ detail, chapters }: { detail: MangaDetail; chapters: Chapter[] }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border-default">
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={20} weight="bold" />
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-accent">Yomirra</span>
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          <List size={20} weight="bold" />
        </button>
      </div>
      {/* Panel grid */}
      <div className="grid grid-cols-2 grid-rows-[auto_auto] border-b-2 border-border-default">
        {/* Panel 1: Cover */}
        <div
          className="relative overflow-hidden border-r-2 border-border-default"
          style={{ aspectRatio: "2/3" }}
        >
          <img
            src={detail.coverUrl || ""}
            alt={detail.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-base/80 to-transparent" />
          <ScoreBadge score={detail.score ?? 0} />
        </div>
        {/* Panel 2: Meta */}
        <div className="flex flex-col justify-between p-3 bg-surface-raised">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-black text-text-primary leading-tight tracking-tight line-clamp-4">
              {detail.title}
            </h1>
            <div className="flex flex-col gap-1.5">
              <Badge>{detail.status}</Badge>
              <Badge accent>{detail.format || "Comic"}</Badge>
            </div>
            {detail.author && (
              <div className="flex flex-col mt-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">Author</span>
                <span className="text-xs font-semibold text-text-secondary">{detail.author}</span>
              </div>
            )}
          </div>
          {/* Progress */}
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">Progress</span>
            <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-accent rounded-full" />
            </div>
            <span className="text-[10px] text-text-muted">Ch.{Math.floor(chapters.length / 3)} / {chapters.length}</span>
          </div>
        </div>
      </div>
      {/* Panel 3: Actions — full width */}
      <div className="border-b-2 border-border-default">
        <div className="p-3">
          <PrimaryBtn label="Mulai Baca" icon={<Play weight="fill" size={16} />} />
        </div>
        <div className="border-t-2 border-border-default">
          <ActionRow />
        </div>
      </div>
      {/* Panel 4: Synopsis */}
      {detail.description && (
        <div className="border-b-2 border-border-default p-4">
          <span className="text-[9px] uppercase tracking-widest font-black text-accent block mb-2">Sinopsis</span>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
            {detail.description}
          </p>
        </div>
      )}
      {/* Panel 5: Genres */}
      <div className="border-b-2 border-border-default p-4 flex flex-wrap gap-2">
        {(detail.genres ?? []).map((g) => (
          <Badge key={g}>{g}</Badge>
        ))}
      </div>
      {/* Panel 6: Chapters */}
      <div className="p-4 pb-8">
        <ChapterList chapters={chapters} />
      </div>
    </div>
  );
}

// ─── Variant 5: Poster Showcase ───────────────────────────────────────────────

function PosterShowcase({ detail, chapters }: { detail: MangaDetail; chapters: Chapter[] }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <button className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center border border-border-subtle">
          <ArrowLeft size={18} weight="bold" className="text-text-secondary" />
        </button>
        <button className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center border border-border-subtle">
          <Bell size={18} weight="duotone" className="text-text-secondary" />
        </button>
      </div>
      {/* Poster — center stage */}
      <div className="flex flex-col items-center px-10 pt-2 pb-6">
        <div
          className="relative w-full max-w-[220px] rounded-3xl overflow-hidden shadow-heavy border border-border-default"
          style={{ aspectRatio: "2/3" }}
        >
          <img
            src={detail.coverUrl || ""}
            alt={detail.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Floating badge chips over poster */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            <ScoreBadge score={detail.score ?? 0} />
            <Badge>{detail.status}</Badge>
            <Badge accent>{detail.format || "Comic"}</Badge>
          </div>
        </div>
        {/* Title under poster — generous spacing */}
        <div className="mt-6 text-center flex flex-col gap-2">
          <h1 className="text-2xl font-black text-text-primary leading-tight tracking-tight">
            {detail.title}
          </h1>
          {detail.author && (
            <p className="text-sm text-text-muted font-medium">{detail.author}</p>
          )}
        </div>
      </div>
      {/* CTA */}
      <div className="px-5 flex flex-col gap-3">
        <PrimaryBtn label="Mulai Baca" icon={<Play weight="fill" size={18} />} />
        {/* Progress bar under CTA */}
        <div className="flex items-center gap-3 bg-surface-raised rounded-xl p-3 border border-border-subtle">
          <Article size={18} weight="duotone" className="text-accent shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Progress</span>
              <span className="text-[11px] text-text-muted">Ch.{Math.floor(chapters.length * 0.35)} / {chapters.length}</span>
            </div>
            <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden mt-1">
              <div className="h-full w-[35%] bg-accent rounded-full" />
            </div>
          </div>
        </div>
        <ActionRow />
      </div>
      <div className="px-5 mt-4">
        <div className="h-px bg-border-subtle" />
      </div>
      {/* Synopsis */}
      {detail.description && (
        <div className="px-5 mt-4">
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
            {detail.description}
          </p>
          <button className="text-xs text-accent font-semibold mt-1.5">Selengkapnya</button>
        </div>
      )}
      {/* Genres */}
      <div className="px-5 mt-4 flex flex-wrap gap-2">
        {(detail.genres ?? []).map((g) => (
          <Badge key={g}>{g}</Badge>
        ))}
      </div>
      <div className="px-5 mt-6 pb-8">
        <ChapterList chapters={chapters} />
      </div>
    </div>
  );
}

// ─── Desktop Wrapper ──────────────────────────────────────────────────────────

function DesktopAdapter({ detail, chapters, variant }: { detail: MangaDetail; chapters: Chapter[]; variant: Variant }) {
  // For desktop, show a 2-col layout regardless of variant philosophy
  const isHero = variant === "hero-full-width";
  const isGlass = variant === "glassmorphism";

  return (
    <div className={cn("min-h-screen flex flex-col relative", isGlass && "overflow-hidden")}>
      {/* Background (all variants) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={detail.coverUrl || ""}
          alt=""
          className={cn("w-full h-full object-cover transform-gpu will-change-transform", isGlass ? "opacity-25 blur-3xl scale-110 saturate-200" : "opacity-20 blur-[80px] scale-110")}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-surface-base/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-base/80 to-surface-base" />
      </div>
      {/* Desktop nav */}
      <div className="relative z-10 flex items-center gap-4 px-8 py-5 border-b border-border-subtle bg-surface-glass backdrop-blur-xl">
        <button className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center border border-border-subtle">
          <ArrowLeft size={18} weight="bold" className="text-text-secondary" />
        </button>
        <span className="text-sm font-bold text-text-primary flex-1 line-clamp-1">{detail.title}</span>
        <button className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center border border-border-subtle">
          <Bell size={18} weight="duotone" className="text-text-secondary" />
        </button>
      </div>
      {/* Content */}
      <div className="relative z-10 flex gap-10 px-10 pt-10 pb-12 max-w-5xl mx-auto w-full">
        {/* Left col: Cover */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-heavy border border-border-default">
            <img
              src={detail.coverUrl || ""}
              alt={detail.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Floating chips */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              <ScoreBadge score={detail.score ?? 0} />
              <Badge accent>{detail.format || "Comic"}</Badge>
            </div>
          </div>
          <PrimaryBtn label="Mulai Baca" icon={<Play weight="fill" size={18} />} />
          <ActionRow />
        </div>
        {/* Right col: Info */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge>{detail.status}</Badge>
              <Badge>{detail.format || "Comic"}</Badge>
            </div>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter leading-tight">
              {detail.title}
            </h1>
            {detail.author && (
              <p className="text-sm text-text-muted font-medium">{detail.author}</p>
            )}
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3 bg-surface-raised rounded-xl p-4 border border-border-subtle">
            <CheckCircle size={20} weight="duotone" className="text-accent shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-text-primary">Progress Membaca</span>
                <span className="text-xs text-text-muted">Ch.{Math.floor(chapters.length / 3)} / {chapters.length}</span>
              </div>
              <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-accent rounded-full" />
              </div>
            </div>
          </div>
          {/* Synopsis */}
          {detail.description && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Sinopsis</span>
              <p className="text-sm text-text-secondary leading-relaxed">{detail.description}</p>
            </div>
          )}
          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {(detail.genres ?? []).map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </div>
          <div className="h-px bg-border-subtle" />
          {/* Chapters */}
          <ChapterList chapters={chapters} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Shell ──────────────────────────────────────────────────────────

const VARIANTS: { key: Variant; label: string }[] = [
  { key: "hero-full-width", label: "Hero Full-Width" },
  { key: "card-minimal", label: "Card Minimal" },
  { key: "glassmorphism", label: "Glassmorphism" },
  { key: "manga-panel", label: "Manga Panel" },
  { key: "poster-showcase", label: "Poster Showcase" },
];

function renderVariant(variant: Variant, detail: MangaDetail, chapters: Chapter[]) {
  switch (variant) {
    case "hero-full-width":
      return <HeroFullWidth detail={detail} chapters={chapters} />;
    case "card-minimal":
      return <CardMinimal detail={detail} chapters={chapters} />;
    case "glassmorphism":
      return <GlassmorphismVariant detail={detail} chapters={chapters} />;
    case "manga-panel":
      return <MangaPanelVariant detail={detail} chapters={chapters} />;
    case "poster-showcase":
      return <PosterShowcase detail={detail} chapters={chapters} />;
  }
}

export function MangaDetailDemoClient({ detail, chapters, sourceId, mangaId, fetchError }: DemoProps) {
  const [activeVariant, setActiveVariant] = React.useState<Variant>("hero-full-width");
  const [colorMode, setColorMode] = React.useState<ColorMode>("dark");

  const data = detail ?? FALLBACK;
  const chapterData = chapters.length > 0 ? chapters : FALLBACK_CHAPTERS;

  const isFallback = !detail;

  return (
    <div className={colorMode === "dark" ? "dark" : "light"}>
      <div className="min-h-screen bg-zinc-950 text-text-primary font-sans transition-colors duration-300">
        {/* ── Demo Control Bar ── */}
        <div className="sticky top-0 z-50 flex flex-col gap-3 px-4 py-3 bg-zinc-900/95 backdrop-blur-md border-b border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between text-white">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Yomirra Design Lab</span>
              <span className="text-sm font-black text-white">Manga Detail — 5 Variasi</span>
            </div>
            {/* Dark/Light toggle */}
            <button
              onClick={() => setColorMode(colorMode === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold text-white border border-white/10"
            >
              {colorMode === "dark" ? "☀ Light" : "● Dark"}
            </button>
          </div>
          {/* Variant tabs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                onClick={() => setActiveVariant(v.key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  activeVariant === v.key
                    ? "bg-accent text-white border-accent shadow-lg shadow-accent/30"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          {/* Data source info */}
          <div className="flex items-center gap-2">
            {isFallback && (
              <span className="text-[10px] font-bold text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/20 px-2 py-0.5 rounded-full">
                ⚠ Fallback data — Shinigami unreachable
              </span>
            )}
            {!isFallback && (
              <span className="text-[10px] font-bold text-semantic-success bg-semantic-success/10 border border-semantic-success/20 px-2 py-0.5 rounded-full">
                ✓ Data asli dari Shinigami
              </span>
            )}
          </div>
        </div>

        {/* ── Side-by-side Frame ── */}
        <div className="flex gap-6 p-4 md:p-6 overflow-x-auto items-start">
          {/* Mobile Frame (390px) */}
          <div className="shrink-0 flex flex-col gap-2">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">
              Mobile — 390px
            </div>
            <div
              className="rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-2xl"
              style={{ width: 390, height: 844 }}
            >
              <div
                className="w-full h-full overflow-y-auto overflow-x-hidden bg-surface-base scrollbar-hide"
                style={{ fontSize: "15px" }}
              >
                {renderVariant(activeVariant, data, chapterData)}
              </div>
            </div>
          </div>

          {/* Desktop Frame (1024px) */}
          <div className="shrink-0 flex flex-col gap-2">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">
              Desktop — 1024px
            </div>
            <div
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl"
              style={{ width: 1024, height: 768 }}
            >
              <div
                className="w-full h-full overflow-y-auto overflow-x-hidden bg-surface-base scrollbar-hide"
                style={{ fontSize: "15px" }}
              >
                <DesktopAdapter detail={data} chapters={chapterData} variant={activeVariant} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
