import type { ReactNode } from "react";
import { MangaCover } from "./manga-cover";

export function CatalogDetailSummary({ title, author, coverUrl, sourceId, mangaId, actions, children }: {
  title: string;
  author?: string;
  coverUrl?: string;
  sourceId: string;
  mangaId: string;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 sm:flex-row md:gap-8">
      <div className="w-32 shrink-0 overflow-hidden rounded-xl border border-border-default bg-surface-raised aspect-2/3 sm:w-40 lg:w-48">
        <MangaCover src={coverUrl} sourceId={sourceId} mangaId={mangaId} alt="" fallbackTitle={title} />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <h1 className="max-w-4xl wrap-break-word text-xl font-bold leading-tight tracking-tight text-text-primary sm:text-2xl lg:text-3xl">{title}</h1>
        {author && <p className="text-sm text-text-secondary">{author}</p>}
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
        {children && <div className="max-w-prose space-y-2 text-sm text-text-secondary">{children}</div>}
      </div>
    </section>
  );
}
