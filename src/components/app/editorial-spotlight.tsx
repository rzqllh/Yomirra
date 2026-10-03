"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { MangaCover } from "@/components/manga/manga-cover";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { transitions } from "@/shared/lib/motion/tokens";
import { cn } from "@/shared/utils/cn";
import type { MangaItem } from "@/shared/sources/source-types";

export interface EditorialSpotlightProps {
  manga: MangaItem;
  sourceId: string;
  sourceName: string;
  direction?: 1 | -1;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
}

export function EditorialSpotlight({
  manga,
  sourceId,
  sourceName,
  direction = 1,
  currentIndex = 0,
  totalCount = 1,
  onNext,
  onPrev,
  className,
}: EditorialSpotlightProps) {
  const reducedMotion = useReducedMotion();
  const href = getMangaDetailHref(sourceId, manga.id, "/");
  const description = manga.description?.trim() || "Sinopsis belum tersedia";
  const metadata = [manga.format, manga.latestChapter, sourceName].filter(Boolean);

  return (
    <article
      aria-label={`Sorotan komik: ${manga.title}`}
      className={cn(
        "ink-panel relative h-[268px] min-w-0 overflow-hidden sm:h-[310px] lg:h-[340px]",
        className
      )}
    >
      {manga.coverUrl && (
        <>
          <img
            src={manga.coverUrl}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full scale-105 object-cover opacity-[0.14]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface-raised via-surface-raised/90 to-surface-raised/72"
          />
        </>
      )}

      <motion.div
        key={`${sourceId}:${manga.id}`}
        initial={
          reducedMotion
            ? false
            : { opacity: 0.92, x: direction === 1 ? 8 : -8 }
        }
        animate={{ opacity: 1, x: 0 }}
        transition={reducedMotion ? { duration: 0 } : transitions.gentle}
        className="absolute inset-0 grid min-w-0 grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)]"
      >
        <Link
          href={href}
          className="group flex min-w-0 items-center justify-center p-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:p-3 lg:p-4"
          aria-label={`Lihat komik ${manga.title}`}
        >
          <div className="aspect-[2/3] w-full max-w-[104px] overflow-hidden rounded-[10px] border border-border-subtle bg-surface-muted sm:max-w-[126px] lg:max-w-[176px]">
            <MangaCover
              src={manga.coverUrl}
              alt={manga.title}
              fallbackTitle={manga.title}
              className="size-full"
              imageClassName="size-full object-cover"
            />
          </div>
        </Link>

        <div className="relative flex min-w-0 flex-col p-3.5 sm:p-5 lg:p-6">
          <div className="flex min-h-0 flex-1 flex-col">
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-accent sm:text-[11px]">
              SOROTAN TERBARU
            </p>

            <Link
              href={href}
              className="group rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <h2 className="min-h-[46px] line-clamp-2 text-xl font-bold leading-[1.15] tracking-tight text-text-primary transition-colors group-hover:text-accent sm:min-h-[58px] sm:text-2xl lg:min-h-[74px] lg:text-[32px]">
                {manga.title}
              </h2>
            </Link>

            <p
              className="mt-2 min-h-[34px] line-clamp-2 text-[11.5px] leading-relaxed text-text-secondary sm:min-h-[60px] sm:line-clamp-3 sm:text-sm"
              data-spotlight-slot="synopsis"
            >
              {description}
            </p>

            <p
              className="mt-2 min-h-4 line-clamp-1 text-[10.5px] font-semibold text-text-muted sm:text-xs"
              data-spotlight-slot="metadata"
            >
              {metadata.map((item, index) => (
                <React.Fragment key={`${item}-${index}`}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </p>
          </div>

          <div className="mt-auto flex min-w-0 items-end justify-between gap-2 border-t border-border-subtle/60 pt-2.5">
            <Link
              href={href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-2 text-xs font-bold text-accent transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-accent sm:text-sm"
            >
              <span>Lihat komik</span>
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>

            {totalCount > 1 && (
              <div
                className="flex shrink-0 items-center gap-1.5"
                role="region"
                aria-label="Kontrol sorotan"
              >
                <span
                  className="hidden font-mono text-[10px] font-bold tabular-nums text-text-muted sm:inline"
                  aria-live="polite"
                >
                  {String(currentIndex + 1).padStart(2, "0")} /{" "}
                  {String(totalCount).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Komik sebelumnya"
                  className="flex size-11 items-center justify-center rounded-[10px] border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <CaretLeft size={16} weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Komik berikutnya"
                  className="flex size-11 items-center justify-center rounded-[10px] border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <CaretRight size={16} weight="bold" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </article>
  );
}
