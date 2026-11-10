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
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-text-muted/50 p-2">
          <ImageBroken size={iconSize} weight="duotone" className="mb-1" />
          {fallbackTitle && (
            <span className="text-2xs font-medium text-center line-clamp-2 px-1 text-text-muted">
              {fallbackTitle}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
