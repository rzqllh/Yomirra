"use client";

import * as React from "react";
import { ImageBroken } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface MangaCoverProps {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackTitle?: string;
  iconSize?: number;
}

export function MangaCover({
  src,
  alt,
  priority = false,
  className,
  imageClassName,
  fallbackTitle,
  iconSize = 32,
}: MangaCoverProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state if src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const hasValidImage = src && !imageError;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-surface-muted", className)}>
      {hasValidImage ? (
        <img
          src={src}
          alt={alt}
          className={cn("absolute inset-0 w-full h-full object-cover", imageClassName)}
          onError={() => setImageError(true)}
          ref={(img) => {
            if (img && img.complete && img.naturalWidth === 0) {
              setImageError(true);
            }
          }}
          referrerPolicy="no-referrer"
          decoding="async"
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-text-muted/50 p-2">
          <ImageBroken size={iconSize} weight="duotone" className="mb-1" />
          {fallbackTitle && (
            <span className="text-[11px] font-medium text-center line-clamp-2 px-1 text-text-muted">
              {fallbackTitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
