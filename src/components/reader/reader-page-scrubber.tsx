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
  onScrubbingChange?: (isScrubbing: boolean) => void;
}

export function ReaderPageScrubber({
  navigation,
  direction = "ltr",
  minimal = false,
  className,
  onScrubbingChange,
}: ReaderPageScrubberProps) {
  const handleStartScrubbing = React.useCallback(() => {
    onScrubbingChange?.(true);
  }, [onScrubbingChange]);

  const handleEndScrubbing = React.useCallback(() => {
    onScrubbingChange?.(false);
  }, [onScrubbingChange]);

  const total = Math.max(0, navigation.total);
  if (!total) return null;
  const page = Math.min(total, Math.max(1, navigation.index + 1));
  const isContinuous = navigation.mode === "continuous";
  const progressPercent = Math.min(100, Math.max(0, Math.round(navigation.progress ?? 0)));

  if (minimal) {
    return (
      <div
        className={cn(
          "yomirra-chrome pointer-events-auto select-none rounded-lg px-2.5 py-1 text-text-primary text-2xs font-mono font-medium tracking-tight",
          className
        )}
        data-testid="reader-page-scrubber"
      >
        <span>
          {isContinuous ? `${progressPercent}%` : `${page} / ${total}`}
        </span>
      </div>
    );
  }

  if (isContinuous) {
    return (
      <div
        className={cn("w-full flex flex-col gap-1 text-text-primary select-none", className)}
        data-testid="reader-page-scrubber"
        onPointerDown={handleStartScrubbing}
        onTouchStart={handleStartScrubbing}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted px-2.5">
          <label htmlFor="reader-webtoon-range">Progress</label>
          <output htmlFor="reader-webtoon-range" aria-live="off" className="text-text-primary font-bold font-mono">
            {progressPercent}% <span className="font-normal text-text-muted text-2xs">(Hal. {page} / {total})</span>
          </output>
        </div>
        <div className="flex h-10 items-center gap-1">
          <button
            type="button"
            aria-label="Bagian sebelumnya"
            disabled={navigation.canPrevious !== undefined ? !navigation.canPrevious : page <= 1}
            onClick={() => {
              handleStartScrubbing();
              if (navigation.previous) {
                navigation.previous();
              } else {
                navigation.seek(page - 2);
              }
              handleEndScrubbing();
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors"
          >
            <CaretLeft size={16} />
          </button>
          <div className="relative flex min-w-0 flex-1 items-center h-10">
            <input
              id="reader-webtoon-range"
              type="range"
              min={0}
              max={100}
              step={1}
              value={progressPercent}
              aria-label="Progress membaca"
              aria-valuetext={`${progressPercent}%`}
              className="reader-page-range relative z-10 h-10 w-full cursor-pointer bg-transparent accent-accent focus-visible:outline-2 focus-visible:outline-accent"
              onPointerDown={handleStartScrubbing}
              onPointerUp={handleEndScrubbing}
              onPointerCancel={handleEndScrubbing}
              onTouchStart={handleStartScrubbing}
              onTouchEnd={handleEndScrubbing}
              onTouchCancel={handleEndScrubbing}
              onMouseDown={handleStartScrubbing}
              onMouseUp={handleEndScrubbing}
              onChange={(event) => {
                handleStartScrubbing();
                const percent = Number(event.target.value);
                if (navigation.seekProgress) {
                  navigation.seekProgress(percent);
                } else {
                  navigation.seek(Math.round((percent / 100) * (total - 1)));
                }
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Bagian berikutnya"
            disabled={navigation.canNext !== undefined ? !navigation.canNext : page >= total}
            onClick={() => {
              handleStartScrubbing();
              if (navigation.next) {
                navigation.next();
              } else {
                navigation.seek(page);
              }
              handleEndScrubbing();
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors"
          >
            <CaretRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full flex flex-col gap-1 text-text-primary select-none", className)}
      data-testid="reader-page-scrubber"
      onPointerDown={handleStartScrubbing}
      onTouchStart={handleStartScrubbing}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-text-muted px-2.5">
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
          onClick={() => {
            handleStartScrubbing();
            if (navigation.previous) {
              navigation.previous();
            } else {
              navigation.seek(page - 2);
            }
            handleEndScrubbing();
          }}
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
            onPointerDown={handleStartScrubbing}
            onPointerUp={handleEndScrubbing}
            onPointerCancel={handleEndScrubbing}
            onTouchStart={handleStartScrubbing}
            onTouchEnd={handleEndScrubbing}
            onTouchCancel={handleEndScrubbing}
            onMouseDown={handleStartScrubbing}
            onMouseUp={handleEndScrubbing}
            onChange={(event) => {
              handleStartScrubbing();
              navigation.seek(Number(event.target.value) - 1);
            }}
          />
        </div>
        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={navigation.canNext !== undefined ? !navigation.canNext : page >= total}
          onClick={() => {
            handleStartScrubbing();
            if (navigation.next) {
              navigation.next();
            } else {
              navigation.seek(page);
            }
            handleEndScrubbing();
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors"
        >
          <CaretRight size={16} />
        </button>
      </div>
    </div>
  );
}
