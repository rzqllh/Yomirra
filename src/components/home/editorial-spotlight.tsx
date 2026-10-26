"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CaretLeft, CaretRight, Star } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useQuery, QueryClientContext } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { runCardDetailEnrichment } from "@/shared/lib/card-detail-enrichment";
import { MangaCover } from "@/components/komik/manga-cover";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { transitions } from "@/shared/lib/motion/tokens";
import { cn } from "@/shared/utils/cn";
import { normalizeSynopsis } from "@/shared/utils/normalize";
import type { MangaItem } from "@/shared/sources/source-types";

function SpotlightMetadataFallback({
  manga,
  sourceName,
}: {
  manga: MangaItem;
  sourceName: string;
}) {
  const hasStatus = Boolean(manga.status);
  const hasFormat = Boolean(manga.format);
  const hasChapter = Boolean(manga.latestChapter);
  const hasScore = Number(manga.score) > 0;
  const genres = Array.isArray((manga as any).genres) ? (manga as any).genres.slice(0, 3) : [];

  return (
    <div
      className="mt-2.5 flex flex-wrap items-center gap-1.5"
      data-spotlight-slot="synopsis-absent"
    >
      {hasStatus && (
        <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase text-accent border border-accent/20">
          {manga.status}
        </span>
      )}
      {hasFormat && (
        <span className="inline-flex items-center rounded-md bg-surface-base px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase text-text-secondary border border-border-subtle">
          {manga.format}
        </span>
      )}
      {hasChapter && (
        <span className="inline-flex items-center rounded-md bg-surface-base px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-text-primary border border-border-subtle">
          {manga.latestChapter!.startsWith("Ch") ? manga.latestChapter : `Ch. ${manga.latestChapter}`}
        </span>
      )}
      {hasScore && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-500 border border-amber-500/20">
          <Star size={11} weight="fill" />
          <span>{Number(manga.score).toFixed(1)}</span>
        </span>
      )}
      {genres.map((g: string) => (
        <span
          key={g}
          className="inline-flex items-center rounded-md bg-surface-base/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-text-muted border border-border-subtle/60"
        >
          {g}
        </span>
      ))}
      <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-text-muted border border-border-subtle">
        {sourceName}
      </span>
    </div>
  );
}

function SpotlightSynopsis({
  manga,
  sourceId,
  sourceName,
  initialSynopsis,
}: {
  manga: MangaItem;
  sourceId: string;
  sourceName: string;
  initialSynopsis: string;
}) {
  const hasQueryClient = Boolean(React.useContext(QueryClientContext));

  if (initialSynopsis) {
    return (
      <p
        className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-text-secondary sm:line-clamp-3 sm:text-sm"
        data-spotlight-slot="synopsis"
      >
        {initialSynopsis}
      </p>
    );
  }

  if (hasQueryClient && sourceId && manga.id) {
    return <SpotlightLazySynopsis manga={manga} sourceId={sourceId} sourceName={sourceName} />;
  }

  return <SpotlightMetadataFallback manga={manga} sourceName={sourceName} />;
}

function SpotlightLazySynopsis({
  manga,
  sourceId,
  sourceName,
}: {
  manga: MangaItem;
  sourceId: string;
  sourceName: string;
}) {
  const { data } = useQuery({
    queryKey: ["manga-card-synopsis", sourceId, manga.id],
    queryFn: ({ signal }) =>
      runCardDetailEnrichment(
        () => apiClient.getDetail(sourceId, manga.id, { signal }),
        signal
      ),
    enabled: Boolean(sourceId && manga.id),
    staleTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const raw =
    data?.description ||
    (data as any)?.synopsis ||
    (data as any)?.summary ||
    (data as any)?.excerpt;
  const synopsis = raw ? normalizeSynopsis(String(raw)).trim() : "";

  if (!synopsis) {
    return <SpotlightMetadataFallback manga={manga} sourceName={sourceName} />;
  }

  return (
    <p
      className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-text-secondary sm:line-clamp-3 sm:text-sm"
      data-spotlight-slot="synopsis"
    >
      {synopsis}
    </p>
  );
}

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
  const rawDesc = manga.description || (manga as any)?.synopsis || (manga as any)?.summary || (manga as any)?.excerpt;
  const cleanedDescription = rawDesc ? normalizeSynopsis(String(rawDesc)).trim() : "";
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
              <h2 className="line-clamp-2 text-xl font-bold leading-[1.15] tracking-tight text-text-primary transition-colors group-hover:text-accent sm:text-2xl lg:text-[32px]">
                {manga.title}
              </h2>
            </Link>

            <SpotlightSynopsis
              manga={manga}
              sourceId={sourceId}
              sourceName={sourceName}
              initialSynopsis={cleanedDescription}
            />

            <div
              className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-text-muted sm:text-xs"
              data-spotlight-slot="metadata"
            >
              {Number(manga.score) > 0 && (
                <>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                    <Star size={13} weight="fill" aria-hidden="true" />
                    <span>{Number(manga.score).toFixed(1)}</span>
                  </span>
                  <span aria-hidden="true" className="text-border-default/80">·</span>
                </>
              )}
              {manga.latestChapter && (
                <>
                  <span className="text-text-primary">
                    {manga.latestChapter.startsWith("Ch") ? manga.latestChapter : `Ch. ${manga.latestChapter}`}
                  </span>
                  <span aria-hidden="true" className="text-border-default/80">·</span>
                </>
              )}
              <span className="font-bold text-accent">{sourceName}</span>
              {manga.format && (
                <>
                  <span aria-hidden="true" className="text-border-default/80">·</span>
                  <span className="uppercase text-[10px] tracking-wider text-text-muted">{manga.format}</span>
                </>
              )}
            </div>
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
