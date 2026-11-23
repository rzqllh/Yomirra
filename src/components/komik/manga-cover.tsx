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
  const resolvedCover = useCoverCacheStore((s) =>
    sourceId && mangaId ? s.resolutions[`${sourceId}::${mangaId}`]?.coverUrl : null
  );
  const effectiveSrc = resolvedCover || src;
  const [failedSrc, setFailedSrc] = React.useState<string>();

  const markFailed = React.useCallback(() => {
    setFailedSrc(effectiveSrc);
    if (sourceId && mangaId) {
      void resolveMangaCover(sourceId, mangaId, effectiveSrc);
    }
    onError?.();
  }, [effectiveSrc, onError, sourceId, mangaId]);

  const checkCachedImage = React.useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete && img.naturalWidth === 0) markFailed();
    },
    [markFailed]
  );
  const hasValidImage = Boolean(effectiveSrc && effectiveSrc !== failedSrc);

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-surface-muted", className)}>
      {hasValidImage ? (
        <img
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
          {fallbackTitle && (
            <>
              <span className="line-clamp-3 text-xs font-semibold leading-relaxed text-text-secondary">
                {fallbackTitle}
              </span>
              <span className="text-2xs text-text-muted">Sampul tidak tersedia</span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
