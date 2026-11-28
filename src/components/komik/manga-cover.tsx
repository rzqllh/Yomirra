"use client";

import * as React from "react";
import { ImageBroken } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { useCoverCacheStore, resolveMangaCover } from "@/shared/store/cover-cache-store";

export interface MangaCoverProps {
  src?: string;
  sourceId?: string;
  mangaId?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackTitle?: string;
  iconSize?: number;
  onError?: () => void;
}

export function MangaCover({
  src,
  sourceId,
  mangaId,
  alt,
  priority = false,
  className,
  imageClassName,
  fallbackTitle,
  iconSize = 32,
  onError,
}: MangaCoverProps) {
  const resolution = useCoverCacheStore((state) =>
    sourceId && mangaId ? state.resolutions[`${sourceId}::${mangaId}`] : undefined
  );
  const resolvedCover = resolution?.status === "RESOLVED" ? resolution.coverUrl : undefined;
  const [failure, setFailure] = React.useState<{ original?: string; urls: string[] }>();
  const failures = failure?.original === src ? failure?.urls ?? [] : [];
  const hasAttemptedImage = failures.length > 0;
  const effectiveSrc = [src, resolvedCover].find((url) => url && !failures.includes(url));
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (src || resolvedCover || hasAttemptedImage || !sourceId || !mangaId || !container) return;

    const recover = () => void resolveMangaCover(sourceId, mangaId);
    if (priority) {
      recover();
      return;
    }
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      recover();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasAttemptedImage, mangaId, priority, resolvedCover, sourceId, src]);

  const markFailed = React.useCallback(() => {
    if (!effectiveSrc) return;
    const failedUrls = [...(failure?.original === src ? failure?.urls ?? [] : []), effectiveSrc];
    setFailure((previous) => ({
      original: src,
      urls: previous && previous.original === src ? [...previous.urls, effectiveSrc] : [effectiveSrc],
    }));
    if (sourceId && mangaId) {
      void resolveMangaCover(sourceId, mangaId, failedUrls);
    }
    onError?.();
  }, [effectiveSrc, failure, onError, sourceId, mangaId, src]);

  const checkCachedImage = React.useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.currentSrc && img.complete && img.naturalWidth === 0) markFailed();
    },
    [markFailed]
  );
  return (
    <div ref={containerRef} className={cn("relative w-full h-full overflow-hidden bg-surface-muted", className)}>
      {effectiveSrc ? (
        <img
          key={effectiveSrc}
          src={effectiveSrc}
          alt={alt}
          className={cn("absolute inset-0 w-full h-full object-cover", imageClassName)}
          onError={markFailed}
          ref={checkCachedImage}
          fetchPriority={priority ? "high" : undefined}
          referrerPolicy="no-referrer"
          decoding="async"
          loading={priority ? "eager" : "lazy"}
        />
      ) : alt || fallbackTitle ? (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 px-3 py-4 text-center">
          <ImageBroken size={Math.min(iconSize, 28)} aria-hidden="true" className="shrink-0 text-text-muted" />
          {fallbackTitle && <span className="line-clamp-3 text-xs font-semibold leading-relaxed text-text-secondary">{fallbackTitle}</span>}
          <span className="text-2xs text-text-muted">Sampul tidak tersedia</span>
        </div>
      ) : null}
    </div>
  );
}
