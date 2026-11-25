"use client";

import * as React from "react";
import Link from "next/link";
import { Compass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { runCardDetailEnrichment } from "@/shared/lib/card-detail-enrichment";
import { normalizeSynopsis } from "@/shared/utils/normalize";
import { MangaCardMeta } from "./primitives";
import { cn } from "@/shared/utils/cn";

export interface DeadSourceFallbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sourceName: string;
}

export function DeadSourceFallbackDialog({
  open,
  onOpenChange,
  title,
  sourceName,
}: DeadSourceFallbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass size={20} weight="regular" className="text-accent" />
            Sumber Tidak Aktif
          </DialogTitle>
          <DialogDescription>
            Komik &ldquo;{title}&rdquo; tersimpan dari sumber{" "}
            <span className="font-semibold text-text-primary">{sourceName}</span>, tetapi sumber ini sedang dinonaktifkan atau belum tersedia.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button asChild variant="primary" className="w-full min-h-11 font-bold">
            <Link href={`/search?q=${encodeURIComponent(title)}`}>
              Cari di Sumber Aktif Lain
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full min-h-11">
            <Link href="/sources">
              Kelola Pengaturan Sumber
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface CollapsibleBadgeRowProps {
  badges: React.ReactNode[];
  className?: string;
  maxVisible?: number;
}

export function CollapsibleBadgeRow({
  badges,
  className,
  maxVisible = 2,
}: CollapsibleBadgeRowProps) {
  const validBadges = badges.filter(Boolean);
  if (validBadges.length === 0) {
    return (
      <div
        aria-hidden="true"
        className={cn("h-5 min-w-0", className)}
        data-card-slot="badges"
      />
    );
  }

  const visible = validBadges.slice(0, maxVisible);
  const overflowCount = validBadges.length - maxVisible;

  return (
    <div className={cn("flex items-center gap-1.5 flex-nowrap overflow-hidden min-w-0 h-5", className)}>
      {visible.map((badge, idx) => (
        <React.Fragment key={idx}>{badge}</React.Fragment>
      ))}
      {overflowCount > 0 && (
        <span
          className="shrink-0 text-3xs font-bold px-1.5 py-0.5 rounded-xs bg-surface-muted text-text-muted border border-border-subtle"
          title={`+${overflowCount} badge lainnya`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

export interface LazySynopsisPreviewProps {
  sourceId: string;
  mangaId: string;
  author?: string;
}

export function LazySynopsisPreview({
  sourceId,
  mangaId,
  author,
}: LazySynopsisPreviewProps) {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [shouldFetch, setShouldFetch] = React.useState(false);

  React.useEffect(() => {
    const element = anchorRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldFetch(true);
        observer.disconnect();
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { data } = useQuery({
    queryKey: ["manga-card-synopsis", sourceId, mangaId],
    queryFn: ({ signal }) =>
      runCardDetailEnrichment(
        () => apiClient.getDetail(sourceId, mangaId, { signal }),
        signal
      ),
    enabled: shouldFetch,
    staleTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const synopsis = normalizeSynopsis(data?.description || "");

  return (
    <div
      ref={anchorRef}
      className="min-h-11"
      data-card-slot="synopsis"
    >
      {synopsis ? (
        <MangaCardMeta as="p" className="mt-1.5 line-clamp-2 leading-relaxed text-text-muted/80 md:line-clamp-3">
          {synopsis}
        </MangaCardMeta>
      ) : author ? (
        <MangaCardMeta as="p" className="mt-1.5 truncate text-2xs text-text-muted/70">
          Karya: {author}
        </MangaCardMeta>
      ) : (
        <MangaCardMeta as="p" className="mt-1.5 text-2xs text-text-muted/70">
          Sinopsis belum tersedia
        </MangaCardMeta>
      )}
    </div>
  );
}
