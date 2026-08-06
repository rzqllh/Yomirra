"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";

import { useUpdateStore } from "@/shared/store/update-store";
import { useUpdateChecker } from "@/shared/hooks/use-update-checker";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaUpdateItem } from "@/shared/types/update";

export function UpdatesList() {
  const { items, markAllAsSeen } = useUpdateStore();
  const { isScanning, triggerScan } = useUpdateChecker();

  useEffect(() => {
    // Mark as seen when the page hydrates/mounts
    markAllAsSeen();
  }, [markAllAsSeen]);

  const groupedUpdates = useMemo(() => {
    const sorted = Object.values(items).sort((a, b) => {
      const timeA = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
      const timeB = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
      return timeB - timeA;
    });

    const groups: Record<string, MangaUpdateItem[]> = {};

    sorted.forEach((item) => {
      if (!item.detectedAt) return;
      const date = new Date(item.detectedAt);
      
      let key = "";
      if (isToday(date)) {
        key = "Hari Ini";
      } else if (isYesterday(date)) {
        key = "Kemarin";
      } else {
        key = format(date, "dd MMM yyyy", { locale: localeId });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [items]);

  const hasUpdates = Object.keys(groupedUpdates).length > 0;
  const errorItems = Object.values(items).filter(item => item.error);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Library Updates
        </h2>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => triggerScan({ forceRefresh: true })}
          disabled={isScanning}
          className="gap-2"
        >
          <ArrowsClockwise 
            size={16} 
            weight="bold" 
            className={isScanning ? "animate-spin" : ""} 
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {errorItems.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-status-danger/10 border border-status-danger/20 flex gap-3 items-start">
          <WarningCircle size={20} className="text-status-danger shrink-0 mt-0.5" weight="fill" />
          <div className="text-sm">
            <p className="text-text-primary font-medium">Gagal memuat beberapa update</p>
            <p className="text-text-secondary mt-1 line-clamp-2">
              {errorItems.map(i => `${i.mangaTitle || i.mangaId} (${i.error})`).join(", ")}
            </p>
          </div>
        </div>
      )}

      {!hasUpdates && (
        <div className="py-24">
          <EmptyState 
            icon={<Bell size={48} className="text-text-muted" weight="duotone" />} 
            title="Tidak ada update" 
            description="Manga di library Anda belum memiliki chapter baru." 
          />
        </div>
      )}

      {hasUpdates && (
        <div className="space-y-8">
          {Object.entries(groupedUpdates).map(([groupDate, groupItems]) => (
            <div key={groupDate} className="space-y-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider pl-1">
                {groupDate}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupItems.map((item) => {
                  const href = item.latestChapterId 
                    ? getReaderHref(item.sourceId, item.mangaId, item.latestChapterId)
                    : getMangaDetailHref(item.sourceId, item.mangaId);

                  return (
                    <Link 
                      key={`${item.sourceId}::${item.mangaId}`}
                      href={href}
                      className="flex gap-4 p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-border-hover hover:bg-surface-hover transition-colors group"
                    >
                      <div className="relative w-16 h-20 sm:w-16 sm:h-24 rounded-md overflow-hidden shrink-0 bg-surface-base">
                        {/* Use native img to bypass external domain restrictions, per guidelines */}
                        {item.coverUrl ? (
                          <img 
                            src={item.coverUrl} 
                            alt={item.mangaTitle || item.mangaId} 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-base text-text-muted">
                            <Bell size={24} weight="duotone" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                          {item.mangaTitle || item.mangaId}
                        </h4>
                        
                        <div className="mt-1.5 space-y-1">
                          {item.latestChapterNumber !== undefined && (
                            <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                              Chapter {item.latestChapterNumber}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-text-muted">
                            <span className="truncate max-w-[100px]">{item.sourceId}</span>
                            <span>•</span>
                            <span>
                              {item.detectedAt ? format(new Date(item.detectedAt), "HH:mm") : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
