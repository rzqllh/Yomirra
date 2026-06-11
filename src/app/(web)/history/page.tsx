"use client";

import React from "react";

import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { useHistoryStore } from "@/shared/store/history-store";
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { Clock, Play } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { HistoryRow } from "@/components/history/history-row";

export default function HistoryPage() {
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const removeHistoryItem = useHistoryStore((state) => state.removeHistoryItem);
  
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const historyItems = mounted ? getHistoryList() : [];

  return (
    <MobilePageShell 
      title="Riwayat"
      action={
        historyItems.length > 0 && (
          <Button 
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm("Hapus semua riwayat baca?")) {
                clearHistory();
              }
            }}
          >
            Hapus semua
          </Button>
        )
      }
    >
      <div className="hidden md:block px-4 py-6 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Riwayat</h1>
      </div>
      {historyItems.length === 0 ? (
        <EmptyState
          icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
          title="Belum ada riwayat baca"
          description="Buka chapter untuk mulai membaca. Progres bacaanmu akan muncul di sini."
          action={
            <Button asChild variant="default" className="rounded-full">
              <Link href="/">
                <Play size={20} weight="fill" />
                Mulai Membaca
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 p-4 max-w-3xl mx-auto w-full">
          {historyItems.map((item) => (
            <HistoryRow
              key={`${item.sourceId}::${item.mangaId}::${item.chapterId}`}
              item={item}
              onRemove={removeHistoryItem}
            />
          ))}
        </div>
      )}
    </MobilePageShell>
  );
}
