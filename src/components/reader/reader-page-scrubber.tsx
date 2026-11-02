"use client";
import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ReaderPageNavigation } from "@/shared/store/reader-store";
import { cn } from "@/shared/utils/cn";

export interface ReaderPageScrubberProps {
  navigation: ReaderPageNavigation;
  direction?: "ltr" | "rtl";
  minimal?: boolean;
  className?: string;
}

export function ReaderPageScrubber({
  navigation,
  direction = "ltr",
  minimal = false,
  className,
}: ReaderPageScrubberProps) {
  const total = Math.max(0, navigation.total);
  if (!total) return null;
  const page = Math.min(total, Math.max(1, navigation.index + 1));

  if (minimal) {
    return (
      <div
        className={cn(
          "yomirra-chrome pointer-events-auto select-none rounded-lg px-2.5 py-1 text-text-primary text-[11.5px] font-mono font-medium tracking-tight",
          className
        )}
        data-testid="reader-page-scrubber"
      >
        <span>{page} / {total}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full flex flex-col gap-1 text-text-primary select-none", className)}
      data-testid="reader-page-scrubber"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-text-muted px-1">
        <label htmlFor="reader-page-range">Halaman</label>
        <output htmlFor="reader-page-range" aria-live="off" className="text-text-primary font-bold font-mono">
          {page} / {total}
        </output>
      </div>
      <div className="flex h-10 items-center gap-1">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={navigation.canPrevious !== undefined ? !navigation.canPrevious : page <= 1}
          onClick={() => navigation.previous ? navigation.previous() : navigation.seek(page - 2)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors"
        >
          <CaretLeft size={16} />
        </button>
        <div className="relative flex min-w-0 flex-1 items-center h-10">
          <svg
            className="pointer-events-none absolute inset-x-[11px] h-2 w-[calc(100%-22px)]"
            viewBox="0 0 1000 8"
            preserveAspectRatio="none"
            aria-hidden="true"
            data-testid="reader-page-dots"
          >
            {Array.from({ length: total }, (_, index) => (
              <circle
                key={index}
                cx={total === 1 ? 500 : direction === "rtl" ? 997 - (index * 994) / (total - 1) : 3 + (index * 994) / (total - 1)}
                cy="4"
                r="2"
                vectorEffect="non-scaling-stroke"
                stroke="currentColor"
                strokeWidth="2"
                className={index < page ? "fill-accent text-accent" : "fill-border-strong text-border-strong"}
              />
            ))}
          </svg>
          <input
            id="reader-page-range"
            dir={direction}
            type="range"
            min={1}
            max={total}
            step={1}
            value={page}
            disabled={total < 2}
            aria-label="Pindah halaman"
            aria-valuetext={`Halaman ${page} dari ${total}`}
            className="reader-page-range relative z-10 h-10 w-full cursor-pointer bg-transparent accent-accent focus-visible:outline-2 focus-visible:outline-accent"
            onChange={(event) => navigation.seek(Number(event.target.value) - 1)}
          />
        </div>
        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={navigation.canNext !== undefined ? !navigation.canNext : page >= total}
          onClick={() => navigation.next ? navigation.next() : navigation.seek(page)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors"
        >
          <CaretRight size={16} />
        </button>
      </div>
    </div>
  );
}
