"use client";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ReaderPageNavigation } from "@/shared/store/reader-store";

export function ReaderPageScrubber({ navigation, direction = "ltr" }: { navigation: ReaderPageNavigation; direction?: "ltr" | "rtl" }) {
  const total = Math.max(0, navigation.total);
  if (!total) return null;
  const page = Math.min(total, Math.max(1, navigation.index + 1));
  return <div className="yomirra-chrome pointer-events-auto w-full max-w-[440px] rounded-2xl px-4 py-2" data-testid="reader-page-scrubber">
    <div className="flex items-center justify-between text-xs font-semibold text-text-secondary"><label htmlFor="reader-page-range">Halaman</label><output htmlFor="reader-page-range" aria-live="off">{page} / {total}</output></div>
    <div className="flex h-11 items-center gap-1">
      <button type="button" aria-label="Halaman sebelumnya" disabled={navigation.canPrevious !== undefined ? !navigation.canPrevious : page <= 1} onClick={() => navigation.previous ? navigation.previous() : navigation.seek(page - 2)} className="flex size-11 shrink-0 items-center justify-center rounded-lg disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"><CaretLeft size={18} /></button>
      <div className="relative flex min-w-0 flex-1 items-center h-11">
      <svg className="pointer-events-none absolute inset-x-[11px] h-2 w-[calc(100%-22px)]" viewBox="0 0 1000 8" preserveAspectRatio="none" aria-hidden="true" data-testid="reader-page-dots">
        {Array.from({ length: total }, (_, index) => <circle key={index} cx={total === 1 ? 500 : direction === "rtl" ? 997 - index * 994 / (total - 1) : 3 + index * 994 / (total - 1)} cy="4" r="2" vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="2" className={index < page ? "fill-accent text-accent" : "fill-text-muted text-text-muted"} />)}
      </svg>
      <input id="reader-page-range" dir={direction} type="range" min={1} max={total} step={1} value={page} disabled={total < 2} aria-label="Pindah halaman" aria-valuetext={`Halaman ${page} dari ${total}`} className="reader-page-range relative z-10 h-11 w-full cursor-pointer bg-transparent accent-accent focus-visible:outline-2 focus-visible:outline-accent" onChange={event => navigation.seek(Number(event.target.value) - 1)} />
      </div>
      <button type="button" aria-label="Halaman berikutnya" disabled={navigation.canNext !== undefined ? !navigation.canNext : page >= total} onClick={() => navigation.next ? navigation.next() : navigation.seek(page)} className="flex size-11 shrink-0 items-center justify-center rounded-lg disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"><CaretRight size={18} /></button>
    </div>
  </div>;
}
