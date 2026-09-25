import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";

export interface UpdatesSkeletonProps {
  count?: number;
  className?: string;
}

export function UpdatesSkeleton({ count = 6, className }: UpdatesSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full", className)}>
      {Array.from({ length: count }).map((_, index) => {
        // Serial staggered wave delay (top to bottom streaming feel)
        const staggerDelay = `${index * 120}ms`;

        return (
          <div
            key={index}
            style={{ animationDelay: staggerDelay }}
            className="p-3 rounded-sm bg-surface-raised/70 border border-border-subtle shadow-xs flex items-center justify-between gap-3 motion-safe:animate-fade-in"
          >
            {/* Left: Thumbnail & Metadata */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Canonical 2:3 manga cover frame. */}
              <div
                style={{ animationDelay: staggerDelay }}
                className="relative w-[52px] sm:w-[58px] aspect-[2/3] rounded-xs overflow-hidden shrink-0 bg-surface-muted/80 border border-border-subtle/60"
              >
                <Skeleton className="w-full h-full rounded-none" />
              </div>

              {/* Text metadata */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title */}
                <Skeleton
                  style={{ animationDelay: staggerDelay }}
                  className="h-4 w-[75%] max-w-[180px] rounded-md"
                />

                {/* Badges row */}
                <div className="flex items-center gap-2">
                  <Skeleton
                    style={{ animationDelay: staggerDelay }}
                    className="h-3.5 w-14 rounded-md"
                  />
                  <Skeleton
                    style={{ animationDelay: staggerDelay }}
                    className="h-3 w-16 rounded-md"
                  />
                </div>

                {/* Notion tag chip */}
                <Skeleton
                  style={{ animationDelay: staggerDelay }}
                  className="h-5 w-24 rounded-md mt-1"
                />
              </div>
            </div>

            {/* Right: 44px action target. */}
            <Skeleton
              style={{ animationDelay: staggerDelay }}
              className="h-11 w-16 rounded-sm shrink-0"
            />
          </div>
        );
      })}
    </div>
  );
}
