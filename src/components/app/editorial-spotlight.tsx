"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "@phosphor-icons/react";
import { MangaCover } from "@/components/manga/manga-cover";
import { getMangaDetailHref } from "@/shared/lib/routes";
import type { MangaItem } from "@/shared/sources/source-types";

interface EditorialSpotlightProps {
  manga: MangaItem;
  sourceId: string;
}

/** One editorial pick, with its portrait cover kept at the right aspect ratio. */
export function EditorialSpotlight({ manga, sourceId }: EditorialSpotlightProps) {
  const href = getMangaDetailHref(sourceId, manga.id, "/");

  return (
    <article className="ink-panel grid min-w-0 grid-cols-[minmax(115px,.68fr)_minmax(0,1.3fr)] overflow-hidden sm:grid-cols-[minmax(165px,.7fr)_minmax(0,1.3fr)]">
      <Link href={href} className="block min-w-0 overflow-hidden focus-visible:outline-2 focus-visible:outline-accent" aria-label={`Lihat ${manga.title}`}>
        <div className="aspect-[2/3] h-full min-h-[290px] w-full max-h-[460px] overflow-hidden bg-surface-muted sm:min-h-[350px]">
          <MangaCover src={manga.coverUrl} alt={manga.title} fallbackTitle={manga.title} imageClassName="transition-transform duration-500 hover:scale-105" />
        </div>
      </Link>
      <div className="flex min-w-0 flex-col justify-between gap-5 p-4 sm:p-7 lg:p-9">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-accent">Pilihan hari ini</p>
          <h2 className="ink-display mt-4 line-clamp-3 text-[clamp(27px,3vw,48px)] text-text-primary">{manga.title}</h2>
          {manga.description && <p className="mt-4 hidden max-w-[46ch] text-sm leading-relaxed text-text-secondary sm:line-clamp-4">{manga.description}</p>}
        </div>
        <div className="flex flex-col items-start gap-4">
          <p className="text-xs font-semibold text-text-secondary sm:text-sm">{[manga.format, manga.latestChapter].filter(Boolean).join(" · ")}</p>
          <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-accent px-4 text-sm font-bold text-accent-on transition-[transform,background-color] duration-300 hover:bg-accent-hover motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <BookOpen size={19} weight="bold" aria-hidden="true" /> Lihat komik <ArrowRight size={17} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
