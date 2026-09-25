"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { MangaCover } from "@/components/manga/manga-cover";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import type { MangaItem } from "@/shared/sources/source-types";

export interface EditorialSpotlightProps {
  manga: MangaItem & { sourceId?: string };
  sourceId?: string;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
}

/**
 * Editorial Spotlight feature showcase with attached carousel navigation.
 * Combines high-impact manga cover presentation with concise editorial metadata.
 */
export function EditorialSpotlight({
  manga,
  sourceId,
  currentIndex = 0,
  totalCount = 1,
  onNext,
  onPrev,
  className,
}: EditorialSpotlightProps) {
  const effectiveSourceId = sourceId || manga.sourceId || "shinigami";
  const href = getMangaDetailHref(effectiveSourceId, manga.id, "/");

  return (
    <article
      aria-label={`Sorotan komik: ${manga.title}`}
      className={cn(
        "ink-panel grid h-full min-w-0 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(180px,38%)_minmax(0,62%)] lg:grid-cols-[minmax(210px,40%)_minmax(0,60%)]",
        className
      )}
    >
      {/* Cover Artwork */}
      <Link
        href={href}
        className="group relative block h-56 sm:h-full w-full min-w-0 overflow-hidden bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
        aria-label={`Lihat komik ${manga.title}`}
      >
        <MangaCover
          src={manga.coverUrl}
          alt={manga.title}
          fallbackTitle={manga.title}
          className="h-full w-full"
          imageClassName="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-overlay/80 via-transparent to-transparent sm:hidden" />
      </Link>

      {/* Editorial Content Frame */}
      <div className="flex flex-1 min-w-0 flex-col justify-between gap-4 p-5 sm:p-6 lg:p-7">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
              Pilihan Hari Ini
            </span>
            {effectiveSourceId && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-base text-text-muted border border-border-subtle">
                {effectiveSourceId}
              </span>
            )}
          </div>

          <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded">
            <h2 className="ink-display line-clamp-2 sm:line-clamp-3 text-[26px] sm:text-[30px] lg:text-[36px] font-normal text-text-primary leading-[1.14] tracking-tight group-hover:text-accent transition-colors">
              {manga.title}
            </h2>
          </Link>

          {manga.description && (
            <p className="mt-2.5 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm leading-relaxed text-text-secondary max-w-[52ch]">
              {manga.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
            {manga.format && <span>{manga.format}</span>}
            {manga.format && manga.latestChapter && <span>·</span>}
            {manga.latestChapter && <span className="text-text-secondary">{manga.latestChapter}</span>}
          </div>
        </div>

        {/* Footer Actions: CTA + Attached Carousel Navigation */}
        <div className="mt-2 pt-3 border-t border-border-subtle/50 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={href}
            className="inline-flex min-h-10 sm:min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs sm:text-sm font-bold text-accent-on transition-all hover:bg-accent-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <BookOpen size={18} weight="bold" aria-hidden="true" />
            <span>Lihat komik</span>
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </Link>

          {totalCount > 1 && (
            <div className="flex items-center gap-2.5" role="region" aria-label="Kontrol korsel">
              <span className="font-mono text-xs font-bold text-text-muted select-none" aria-live="polite">
                {String(currentIndex + 1).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Komik sebelumnya"
                  className="flex size-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Komik berikutnya"
                  className="flex size-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
