"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Star,
  TrendUp,
  Play,
  DotsThreeVertical,
  BookOpen,
  Trash,
  Eye,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { MangaCover } from "../manga-cover";
import { BookmarkButton } from "../bookmark-button";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useUpdateStore, getUpdateKey } from "@/shared/store/update-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useHistoryStore, type HistoryItem } from "@/shared/store/history-store";
import { ReadingProgress } from "@/components/ui/reading-progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CanonicalSourceDialog, isCanonicalBindingAvailable } from "../canonical-source-dialog";
import type { SourceBinding } from "@/shared/lib/canonical-search";
import type { MangaKey } from "@/shared/types/collection";
import type { BaseCardProps } from "./types";
import { cn } from "@/shared/utils/cn";
import { getRelativeTime } from "@/shared/utils/date";
import { stripHtml } from "@/shared/utils/normalize";
import { toast } from "sonner";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "./primitives";

export type MangaCardVariant = "discovery" | "rank" | "progress";

export interface CollapsibleBadgeRowProps {
  badges: React.ReactNode[];
  className?: string;
  maxVisible?: number;
}

export function CollapsibleBadgeRow({
  badges,
  className,
  maxVisible = 2,
}: CollapsibleBadgeRowProps) {
  const validBadges = badges.filter(Boolean);
  if (validBadges.length === 0) return null;

  const visible = validBadges.slice(0, maxVisible);
  const overflowCount = validBadges.length - maxVisible;

  return (
    <div className={cn("flex items-center gap-1.5 flex-nowrap overflow-hidden min-w-0 h-5", className)}>
      {visible.map((badge, idx) => (
        <React.Fragment key={idx}>{badge}</React.Fragment>
      ))}
      {overflowCount > 0 && (
        <span
          className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-surface-muted text-text-muted border border-border-subtle"
          title={`+${overflowCount} badge lainnya`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

export interface MangaCardProps extends BaseCardProps {
  variant?: MangaCardVariant;
  viewMode?: "grid" | "compact";
  showSourceBadge?: boolean;
  sourceBindings?: SourceBinding[];
  rank?: number;
  latestChapterTime?: string;
  historyItem?: HistoryItem;
  progressPercent?: number;
  chapterTitle?: string;
  chapterId?: string;
  onDeleteOverride?: (sourceId: string, mangaId: string, title: string) => void;
  animateReveal?: boolean;
  index?: number;
  className?: string;
}

export function MangaCard({
  manga,
  sourceId,
  variant = "discovery",
  viewMode = "grid",
  priority = false,
  displayScore,
  showSourceBadge = false,
  sourceBindings,
  rank,
  latestChapterTime,
  historyItem,
  progressPercent,
  chapterTitle,
  chapterId,
  onDeleteOverride,
  animateReveal,
  index,
  className,
}: MangaCardProps) {
  let pathname = "";
  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try {
    if (typeof usePathname === "function") {
      pathname = usePathname() || "";
    }
  } catch {}
  try {
    if (typeof useSearchParams === "function") {
      searchParams = useSearchParams();
    }
  } catch {}
  const reducedMotion = useReducedMotion();
  const hasIntersectionObserver = typeof window !== "undefined" && typeof (window as any).IntersectionObserver !== "undefined";
  const shouldReveal = Boolean(animateReveal && !reducedMotion && hasIntersectionObserver);

  const { readingStatusByManga } = useCollectionStore();
  const updateStore = useUpdateStore();
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources);
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);

  const fullPath = (pathname || "") + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, "-");
  const vtName = `manga-cover-${safeId}`;
  const vtTitleName = `manga-title-${safeId}`;
  const vtStyle = { "--vt-name": vtName, "--vt-title-name": vtTitleName } as React.CSSProperties;

  const scoreToDisplay = displayScore ?? manga.score;
  const effectiveRank = rank ?? manga.rank;
  const effectiveTime = latestChapterTime ?? manga.latestChapterTime;

  const sourceObj = dynamicSourceRegistry.get(sourceId) || sourceRegistry.find((s) => s.id === sourceId);
  const sourceName = showSourceBadge ? (sourceObj?.name || sourceId) : null;
  const isUnavailable = sourceObj?.status === "unavailable" || sourceObj?.status === "in-fix";

  const effectiveBindings = (sourceBindings || (manga as any)?.sourceBindings || []) as SourceBinding[];
  const availableBindings = effectiveBindings.filter((binding) =>
    isCanonicalBindingAvailable(binding, disabledSources)
  );
  const isMultiSource = availableBindings.length > 1;
  const [isSourceDialogOpen, setIsSourceDialogOpen] = React.useState(false);

  const mangaKey = `${sourceId}::${manga.id}` as MangaKey;
  const readingStatus = readingStatusByManga[mangaKey];

  const isUnread = React.useMemo(() => {
    const byId = updateStore.items[manga.id];
    if (byId && !byId.seenAt) return true;
    const byLegacy = updateStore.items[getUpdateKey(sourceId, manga.id)];
    if (byLegacy && !byLegacy.seenAt) return true;
    return false;
  }, [updateStore.items, manga.id, sourceId]);

  // ==========================================
  // PROGRESS VARIANT (Bookmark / Riwayat)
  // ==========================================
  if (variant === "progress") {
    const rawProgress = progressPercent ?? historyItem?.seriesProgressPercent ?? historyItem?.progressPercent ?? 0;
    const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));
    const effChapterId = chapterId || historyItem?.chapterId || "";
    const effChapterTitle = chapterTitle || historyItem?.chapterTitle || (effChapterId ? `Ch. ${effChapterId}` : "Detail");
    const readerHref = effChapterId ? getReaderHref(sourceId, manga.id, effChapterId) : getMangaDetailHref(sourceId, manga.id, fullPath);
    const detailHref = getMangaDetailHref(sourceId, manga.id, fullPath);
    const isCompleted = progress === 100;

    const handleDeleteHistory = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (onDeleteOverride) {
        onDeleteOverride(sourceId, manga.id, manga.title);
      } else {
        removeMangaHistory(sourceId, manga.id);
        toast.success(`"${manga.title}" dihapus dari riwayat.`);
      }
    };

    return (
      <article
        className={cn(
          mangaCardSurface({ kind: "enclosed" }),
          "group relative overflow-hidden select-none",
          className
        )}
      >
        <Link
          href={readerHref}
          prefetch={false}
          className={cn(
            "flex min-h-full gap-3.5 p-3 pr-13 sm:p-3.5 sm:pr-14 rounded-md focus-visible:ring-inset",
            mangaCardInteraction.link
          )}
          aria-label={`Lanjut baca ${manga.title}, ${effChapterTitle}`}
        >
          <MangaCardCoverFrame className="w-18 sm:w-20">
            <MangaCover
              src={manga.coverUrl}
              alt={manga.title}
              fallbackTitle={manga.title}
              className="w-full h-full"
              imageClassName={cn("w-full h-full object-cover", mangaCardInteraction.coverImage)}
            />
          </MangaCardCoverFrame>

          <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-text-muted border border-border-subtle">
                  {sourceId}
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded",
                    isCompleted
                      ? "bg-status-success-bg text-status-success-fg border border-status-success-fg/30"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  {progress}%
                </span>
              </div>

              <MangaCardTitle
                density="compact"
                lines={2}
                className={mangaCardInteraction.title}
                title={manga.title}
              >
                {manga.title}
              </MangaCardTitle>
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-text-muted mb-1.5">
                <MangaCardMeta className="truncate mr-2 text-[11px] text-text-muted">
                  {effChapterTitle}
                </MangaCardMeta>
                {/* Upgraded "Lanjut" CTA with ~44px mobile touch area */}
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold transition-all",
                    "bg-accent text-accent-on shadow-xs hover:bg-accent-hover active:scale-95",
                    "min-h-[36px] sm:min-h-0 sm:py-0.5 sm:px-2 sm:text-[11px]"
                  )}
                >
                  <Play size={10} weight="fill" />
                  <span>Lanjut</span>
                </span>
              </div>
              <ReadingProgress
                value={progress}
                size="sm"
                showLabel={false}
                variant={isCompleted ? "success" : "default"}
              />
            </div>
          </div>
        </Link>

        <div className="absolute right-1.5 top-1.5 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Opsi untuk ${manga.title}`}
                className="flex size-11 items-center justify-center rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-hover motion-safe:transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised active:scale-95 data-[state=open]:rotate-90 data-[state=open]:text-text-primary duration-150 cursor-pointer"
              >
                <DotsThreeVertical size={16} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-50">
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href={readerHref} className="flex items-center gap-2">
                  <Play size={14} weight="fill" className="text-accent" />
                  <span>Lanjutkan membaca</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href={detailHref} className="flex items-center gap-2">
                  <BookOpen size={14} />
                  <span>Buka detail komik</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteHistory}
                className="flex items-center gap-2 cursor-pointer text-xs text-semantic-error focus:bg-semantic-error/10 focus:text-semantic-error"
              >
                <Trash size={14} />
                <span>Hapus dari riwayat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </article>
    );
  }

  // ==========================================
  // RANK VARIANT (Popular page)
  // ==========================================
  if (variant === "rank") {
    const timeText = getRelativeTime(effectiveTime);
    const staggerDelay = typeof index === "number" && index < 12 ? index * 0.04 : 0;

    return (
      <motion.article
        initial={shouldReveal ? { opacity: 0, y: 16 } : undefined}
        whileInView={shouldReveal ? { opacity: 1, y: 0 } : undefined}
        viewport={shouldReveal ? { once: true, amount: 0.1 } : undefined}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        transition={{
          ease: "easeOut",
          duration: 0.25,
          delay: shouldReveal ? staggerDelay : 0,
        }}
        className={cn(
          mangaCardSurface({ kind: "enclosed" }),
          "group flex h-[110px] w-full min-w-[280px] overflow-hidden",
          className
        )}
      >
        <Link
          href={getMangaDetailHref(sourceId, manga.id, fullPath)}
          className={cn(
            mangaCardInteraction.link,
            "flex min-w-0 flex-1 gap-2.5 cursor-pointer rounded-l-md vt-hover"
          )}
          aria-label={`Baca ${manga.title}`}
          style={vtStyle}
        >
          {/* Cover Frame with Ranking Badge Overlay */}
          <MangaCardCoverFrame className="h-full w-[74px] border-y-0 border-l-0 rounded-l-md rounded-r-xs group-hover:shadow-lg group-hover:shadow-accent/5">
            <MangaCover
              src={manga.coverUrl}
              alt={manga.title}
              fallbackTitle={manga.title}
              iconSize={24}
              priority={priority}
              imageClassName={mangaCardInteraction.coverImage}
            />

            {/* Top-3 Visual Escalation Badge */}
            {effectiveRank !== undefined && (
              <div
                className={cn(
                  "absolute top-0 left-0 backdrop-blur-md font-black flex items-center justify-center rounded-br-xl shadow-md z-10",
                  effectiveRank === 1
                    ? "bg-amber-500 text-amber-50 text-[12px] w-7.5 h-7.5 ring-1 ring-amber-300/40"
                    : effectiveRank === 2
                    ? "bg-slate-300 text-slate-900 text-[11.5px] w-7 h-7 ring-1 ring-slate-200/50"
                    : effectiveRank === 3
                    ? "bg-amber-700 text-amber-50 text-[11px] w-7 h-7 ring-1 ring-amber-500/30"
                    : "bg-black/80 text-white text-[11px] w-7 h-7"
                )}
              >
                {effectiveRank}
              </div>
            )}
          </MangaCardCoverFrame>

          {/* Info Section */}
          <div className="flex-1 p-3 flex flex-col justify-center min-w-0 transition-all motion-reduce:transition-none bg-transparent">
            {/* Capped Badge Row */}
            <CollapsibleBadgeRow
              maxVisible={2}
              className="mb-2"
              badges={[
                <span key="status" className="text-[9px] font-bold uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md shrink-0">
                  {manga.status || "Ongoing"}
                </span>,
                manga.format ? (
                  <span key="format" className="text-[9px] font-bold uppercase text-text-secondary bg-surface-base px-2 py-0.5 rounded-md shrink-0">
                    {manga.format}
                  </span>
                ) : null,
              ]}
            />

            <MangaCardTitle
              as="h4"
              lines={1}
              className={cn("font-medium leading-normal", mangaCardInteraction.title)}
              title={manga.title}
            >
              {manga.title}
            </MangaCardTitle>

            <div className="mt-1.5 flex items-center justify-between">
              <MangaCardMeta className="truncate pr-2">{manga.latestChapter || "Detail"}</MangaCardMeta>
              {timeText && <MangaCardMeta className="whitespace-nowrap text-[10px] text-text-muted">{timeText}</MangaCardMeta>}
            </div>
          </div>
        </Link>

        {/* Bookmark & Rating Column */}
        <div className="relative flex w-[52px] shrink-0 flex-col items-center justify-center gap-2 bg-transparent">
          <BookmarkButton sourceId={sourceId} manga={manga} className="size-11" />
          <div className="h-px w-6 bg-border-subtle" />
          <div className="flex flex-col items-center gap-0.5 text-semantic-warning">
            <Star weight="fill" size={12} aria-hidden="true" />
            <span className="text-[10px] font-black" suppressHydrationWarning>
              {Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}
            </span>
          </div>
        </div>
      </motion.article>
    );
  }

  // ==========================================
  // DISCOVERY VARIANT — COMPACT / LIST VIEW
  // ==========================================
  if (viewMode === "compact") {
    const mangaFormat = manga.format || (manga as any).type;
    const rawStatus = manga.status ? String(manga.status).toUpperCase() : "";
    const isOngoing = rawStatus.includes("ONGOING") || rawStatus.includes("RELEASING");
    const isCompleted = rawStatus.includes("COMPLETED");

    const rawDesc = manga.description || (manga as any)?.synopsis || (manga as any)?.summary || (manga as any)?.excerpt;
    const cleanedDescription = rawDesc ? stripHtml(String(rawDesc)) : null;

    const badgesList: React.ReactNode[] = [
      manga.status ? (
        <span
          key="status"
          className={cn(
            "font-bold text-[10px] px-2 py-0.5 rounded-xs tracking-wide border shrink-0",
            isOngoing && "border-status-info-fg/20 bg-status-info-bg text-status-info-fg",
            isCompleted && "border-status-success-fg/20 bg-status-success-bg text-status-success-fg",
            !isOngoing && !isCompleted && "border-border-subtle bg-surface-base text-text-secondary"
          )}
        >
          {manga.status}
        </span>
      ) : null,
      mangaFormat ? (
        <span key="format" className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-surface-base border border-border-subtle/80 text-text-muted shrink-0">
          {mangaFormat}
        </span>
      ) : null,
      readingStatus ? (
        <span key="reading" className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent uppercase tracking-wider shrink-0">
          {readingStatus === "reading" ? "Dibaca" : readingStatus === "completed" ? "Selesai" : readingStatus}
        </span>
      ) : null,
      isMultiSource ? (
        <span key="sources" className="text-[9px] font-bold text-accent px-1.5 py-0.5 rounded-xs bg-accent/10 border border-accent/20 shrink-0">
          {availableBindings.length} Sumber
        </span>
      ) : null,
    ];

    const staggerDelay = typeof index === "number" && index < 12 ? index * 0.04 : 0;

    return (
      <motion.article
        layoutId={reducedMotion ? undefined : `manga-card-${sourceId}-${manga.id}`}
        layout={reducedMotion ? false : "position"}
        initial={shouldReveal ? { opacity: 0, y: 16 } : undefined}
        whileInView={shouldReveal ? { opacity: 1, y: 0 } : undefined}
        viewport={shouldReveal ? { once: true, amount: 0.1 } : undefined}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.99 }}
        transition={{
          layout: { type: "spring", stiffness: 320, damping: 30 },
          ease: "easeOut",
          duration: 0.25,
          delay: shouldReveal ? staggerDelay : 0,
        }}
        className={cn(
          mangaCardSurface({ kind: "enclosed" }),
          "group relative flex w-full items-stretch gap-3 overflow-hidden p-3 sm:gap-4 sm:p-3.5",
          className
        )}
      >
        <motion.div
          layoutId={reducedMotion ? undefined : `manga-cover-${sourceId}-${manga.id}`}
          className="w-[84px] shrink-0 sm:w-[96px] md:w-[104px]"
        >
          <Link
            href={getMangaDetailHref(sourceId, manga.id, fullPath)}
            className="block h-full cursor-pointer rounded-sm outline-none"
            aria-label={isMultiSource ? `Pilih sumber untuk ${manga.title}` : `Lihat ${manga.title}`}
            onClick={(event) => {
              if (!isMultiSource) return;
              event.preventDefault();
              setIsSourceDialogOpen(true);
            }}
          >
            <MangaCardCoverFrame className="h-full w-full rounded-sm shadow-xs border-border-subtle/60">
              <MangaCover
                src={manga.coverUrl}
                alt={manga.title}
                priority={priority}
                fallbackTitle={manga.title}
                imageClassName={mangaCardInteraction.coverImage}
              />
            </MangaCardCoverFrame>
          </Link>
        </motion.div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link
                href={getMangaDetailHref(sourceId, manga.id, fullPath)}
                className={cn(mangaCardInteraction.link, "min-w-0 flex-1 rounded-sm")}
                aria-haspopup={isMultiSource ? "dialog" : undefined}
                onClick={(event) => {
                  if (!isMultiSource) return;
                  event.preventDefault();
                  setIsSourceDialogOpen(true);
                }}
              >
                <MangaCardTitle lines={1} className={mangaCardInteraction.title} title={manga.title}>
                  {manga.title}
                </MangaCardTitle>
              </Link>

              <div className="shrink-0 -mt-0.5 -mr-1 relative z-10">
                <BookmarkButton
                  sourceId={sourceId}
                  manga={manga}
                  className="size-11 hover:border-accent hover:text-accent"
                />
              </div>
            </div>

            {/* Row 2: Capped Badge Row to prevent height shifts */}
            <div className="flex items-center gap-2 mt-1">
              {manga.latestChapter && (
                <MangaCardMeta className="truncate font-semibold shrink-0">
                  {manga.latestChapter}
                </MangaCardMeta>
              )}
              <CollapsibleBadgeRow badges={badgesList} maxVisible={2} />
            </div>

            {/* Row 3: Metrics */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
              {scoreToDisplay !== undefined && Number(scoreToDisplay) > 0 && (
                <span className="flex items-center gap-1 font-black text-amber-400">
                  <Star weight="fill" size={13} className="text-amber-400 shrink-0" />
                  <span>{Number(scoreToDisplay).toFixed(1)}</span>
                </span>
              )}

              {(manga as any).views && (
                <span className="flex items-center gap-1 text-text-muted font-medium">
                  <Eye size={13} weight="bold" className="shrink-0" />
                  <span>{typeof (manga as any).views === "number" ? `${((manga as any).views / 1000).toFixed(1)}k` : (manga as any).views}</span>
                </span>
              )}

              {sourceName && (
                <span className="text-[10px] font-semibold text-text-muted/85 px-1.5 py-0.5 rounded-xs bg-surface-base/80 border border-border-subtle/50">
                  {sourceName}
                </span>
              )}
            </div>

            {/* Row 4: Sanitized Synopsis */}
            {cleanedDescription ? (
              <MangaCardMeta as="p" className="mt-1.5 line-clamp-2 leading-relaxed text-text-muted/80 md:line-clamp-3">
                {cleanedDescription}
              </MangaCardMeta>
            ) : manga.author ? (
              <MangaCardMeta as="p" className="mt-1.5 truncate text-[11px] text-text-muted/70">
                Karya: {manga.author}
              </MangaCardMeta>
            ) : null}
          </div>
        </div>

        {isMultiSource && (
          <CanonicalSourceDialog
            open={isSourceDialogOpen}
            onOpenChange={setIsSourceDialogOpen}
            title={manga.title}
            sourceBindings={availableBindings}
            returnTo={fullPath}
          />
        )}
      </motion.article>
    );
  }

  // ==========================================
  // DISCOVERY VARIANT — GRID VIEW (Canonical baseline)
  // ==========================================
  const readingStatusMap: Record<string, { label: string; bg: string }> = {
    reading: { label: "Sedang dibaca", bg: "bg-accent-dim text-accent" },
    completed: { label: "Selesai", bg: "bg-status-success-bg text-status-success-fg" },
    "on-hold": { label: "Ditunda", bg: "bg-status-warning-bg text-status-warning-fg" },
    dropped: { label: "Dihentikan", bg: "bg-status-error-bg text-status-error-fg" },
    "plan-to-read": { label: "Akan Dibaca", bg: "bg-surface-raised text-text-primary" },
  };

  const currentReadingConfig = readingStatus ? readingStatusMap[readingStatus] : null;
  const staggerDelay = typeof index === "number" && index < 12 ? index * 0.04 : 0;

  return (
    <motion.article
      layoutId={reducedMotion ? undefined : `manga-card-${sourceId}-${manga.id}`}
      layout={reducedMotion ? false : "position"}
      initial={shouldReveal ? { opacity: 0, y: 16 } : undefined}
      whileInView={shouldReveal ? { opacity: 1, y: 0 } : undefined}
      viewport={shouldReveal ? { once: true, amount: 0.1 } : undefined}
      whileHover={reducedMotion ? undefined : { y: -3 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{
        layout: { type: "spring", stiffness: 320, damping: 30 },
        ease: "easeOut",
        duration: 0.25,
        delay: shouldReveal ? staggerDelay : 0,
      }}
      className={cn(mangaCardSurface({ kind: "open" }), "group relative flex w-full flex-col", className)}
    >
      <Link
        href={getMangaDetailHref(sourceId, manga.id, fullPath)}
        transitionTypes={["nav-forward"]}
        className={cn(mangaCardInteraction.link, "group flex flex-col rounded-xs")}
        aria-label={isMultiSource ? `Pilih sumber untuk ${manga.title}` : `Lihat ${manga.title}`}
        aria-haspopup={isMultiSource ? "dialog" : undefined}
        onClick={(event) => {
          if (!isMultiSource) return;
          event.preventDefault();
          setIsSourceDialogOpen(true);
        }}
      >
        <motion.div
          layoutId={reducedMotion ? undefined : `manga-cover-${sourceId}-${manga.id}`}
          style={vtStyle}
        >
          <MangaCardCoverFrame className="w-full shadow-sm vt-hover">
            <MangaCover
              src={manga.coverUrl}
              alt={manga.title}
              priority={priority}
              fallbackTitle={manga.title}
              imageClassName={mangaCardInteraction.coverImage}
            />

            {/* Over-cover Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20 items-start">
              {isUnread && (
                <div className="flex items-center gap-1 rounded-xs bg-status-info-bg px-2 py-0.5 text-status-info-fg">
                  <span className="text-xs font-bold">Baru</span>
                </div>
              )}

              {isMultiSource && (
                <div className="flex items-center gap-1 rounded-xs bg-surface-glass backdrop-blur-md px-1.5 py-0.5 shadow-sm border border-border-default/40">
                  <span className="text-xs font-bold text-accent">
                    {availableBindings.length} Sumber
                  </span>
                </div>
              )}

              {effectiveRank !== undefined && (
                <div className="flex items-center gap-1 rounded-xs bg-surface-glass backdrop-blur-md px-2 py-1 shadow-sm">
                  <TrendUp weight="bold" className="text-accent text-[10px]" />
                  <span className="text-xs font-black text-text-primary">#{effectiveRank}</span>
                </div>
              )}

              {currentReadingConfig && (
                <div
                  className={cn(
                    "rounded-xs px-2 py-0.5 text-xs font-bold",
                    currentReadingConfig.bg,
                    currentReadingConfig.bg.includes("surface") && "border border-border-subtle"
                  )}
                >
                  {currentReadingConfig.label}
                </div>
              )}
            </div>

            {isUnavailable && (
              <div className="absolute inset-0 bg-surface-base/60 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity group-hover:opacity-100 opacity-90">
                <div className="rounded-xs bg-status-error-bg px-2.5 py-1 text-xs font-bold text-status-error-fg">
                  Tidak Tersedia
                </div>
              </div>
            )}
          </MangaCardCoverFrame>
        </motion.div>

        <div className="flex flex-col px-2 mt-3" style={vtStyle}>
          {/* Capped Badge / Metadata Row — single line strictly fixed height */}
          <CollapsibleBadgeRow
            maxVisible={2}
            className="mb-1.5"
            badges={[
              manga.format ? (
                <MangaCardMeta key="format" className="shrink-0 font-semibold">
                  {manga.format}
                </MangaCardMeta>
              ) : null,
              showSourceBadge && (sourceName || isMultiSource) ? (
                isMultiSource ? (
                  <MangaCardMeta key="source" className="truncate font-semibold text-accent">
                    {availableBindings.length} Sumber
                  </MangaCardMeta>
                ) : sourceName ? (
                  <MangaCardMeta key="source" className="truncate font-semibold text-accent">
                    {sourceName}
                  </MangaCardMeta>
                ) : null
              ) : null,
              manga.status ? (
                <MangaCardMeta key="status" className="shrink-0 text-text-muted font-medium">
                  {manga.status}
                </MangaCardMeta>
              ) : null,
            ]}
          />

          {/* Title - 2 lines fixed height with title attribute for native tooltip fallback */}
          <MangaCardTitle
            lines={2}
            className={cn("mb-2 min-h-[2.4em]", mangaCardInteraction.title)}
            title={manga.title}
          >
            {manga.title}
          </MangaCardTitle>

          {/* Bottom Row - Chapter & Score */}
          {(manga.latestChapter || (scoreToDisplay !== undefined && Number(scoreToDisplay) > 0)) && (
            <div className="flex items-center justify-between mt-auto">
              {manga.latestChapter ? (
                <MangaCardMeta className="max-w-[70%] truncate font-semibold sm:text-sm">
                  {manga.latestChapter}
                </MangaCardMeta>
              ) : (
                <div />
              )}
              {scoreToDisplay !== undefined && Number(scoreToDisplay) > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold tracking-tight text-text-secondary sm:text-sm">
                  <Star weight="fill" className="text-semantic-warning text-sm" />
                  <span suppressHydrationWarning>{Number(scoreToDisplay).toFixed(1)}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="absolute right-2 top-2 z-10 flex items-center justify-center">
        <BookmarkButton sourceId={sourceId} manga={manga} className="size-11" />
      </div>

      {isMultiSource && (
        <CanonicalSourceDialog
          open={isSourceDialogOpen}
          onOpenChange={setIsSourceDialogOpen}
          title={manga.title}
          sourceBindings={availableBindings}
          returnTo={fullPath}
        />
      )}
    </motion.article>
  );
}
