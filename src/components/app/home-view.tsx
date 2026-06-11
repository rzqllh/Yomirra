"use client";

import * as React from "react"
import { MangaCard } from "@/components/manga/manga-card";
import { BookmarkSimple, Play } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import Image from "next/image";
import { SearchInput } from "@/components/ui/search-input";
import type { MangaPageResult } from "@/shared/types/source";

interface HomeViewProps {
  children: React.ReactNode;
}

export function HomeView({ children }: HomeViewProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const continueReadingItems = getContinueReading(4);
  const historyItems = isMounted ? continueReadingItems : [];

  return (
    <main className="min-h-screen bg-surface-base pb-12">
      <h1 className="sr-only">Beranda Yomirra</h1>
      
      {/* Mobile Header / Search */}
      <div className="md:hidden sticky top-0 z-30 bg-surface-base/60 backdrop-blur-xl border-b border-border-subtle/50 shadow-sm pt-[env(safe-area-inset-top)] pb-3 px-4">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSubmitAction={(e, val) => {
            if (val.trim()) router.push(`/search?q=${encodeURIComponent(val.trim())}`);
          }}
          placeholder="Cari manga, manhwa..."
          containerClassName="mt-2 py-2.5"
          className="text-base"
        />
      </div>

      {/* Main Content Area */}
      <div className="px-4 md:px-8 py-6 md:py-10 space-y-14 max-w-7xl mx-auto">
        
        {/* Continue Reading Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Lanjut Baca
            </h2>
            {historyItems.length > 0 && (
              <Link href="/history" className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
                Lihat Semua
              </Link>
            )}
          </div>
          
          {historyItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {historyItems.map((item) => (
                <div key={`${item.sourceId}::${item.mangaId}::${item.chapterId}`} className="group relative flex items-center gap-4 rounded-[var(--radius-lg)] bg-surface-raised p-3 border border-border-subtle transition-colors hover:bg-surface-overlay overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <Link href={getMangaDetailHref(item.sourceId, item.mangaId)} prefetch={false} className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-overlay shadow-sm z-10">
                    {item.coverUrl ? (
                      <Image src={item.coverUrl} alt={item.mangaTitle} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="h-full w-full bg-surface-overlay" />
                    )}
                  </Link>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
                    <Link href={getMangaDetailHref(item.sourceId, item.mangaId)} prefetch={false} className="block min-w-0">
                      <h3 className="truncate font-bold text-text-primary text-sm md:text-base leading-snug group-hover:text-accent transition-colors">
                        {item.mangaTitle}
                      </h3>
                    </Link>
                    <Link href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)} prefetch={false} className="block min-w-0 mt-0.5">
                      <p className="truncate text-sm font-medium text-text-muted group-hover:text-accent transition-colors">
                        {item.chapterTitle || `Chapter ${item.chapterId}`}
                      </p>
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-text-muted">
                      <span className="uppercase tracking-wider">{item.sourceName || item.sourceId}</span>
                      {item.progressPercent !== undefined && item.progressPercent > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-accent">{item.progressPercent}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    asChild
                    variant="accent" 
                    size="icon"
                    className="shrink-0 rounded-full h-10 w-10 shadow-sm relative z-20 ml-2"
                  >
                    <Link href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)} prefetch={false}>
                      <Play className="h-4 w-4" weight="fill" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : isMounted ? (
            <EmptyState
              variant="compact"
              icon={<BookmarkSimple size={28} className="text-text-muted" weight="duotone" />}
              title="Belum ada riwayat baca"
              description="Buka chapter komik manapun dan progresmu akan otomatis muncul di sini."
              className="bg-surface-raised/50 rounded-[var(--radius-lg)] py-12 border border-border-subtle"
            />
          ) : (
            <div className="w-full h-[100px] motion-safe:animate-pulse bg-surface-raised/50 rounded-[var(--radius-lg)] border border-border-subtle" />
          )}
        </section>

        {/* Dynamic Source Feeds */}
        <div className="space-y-12">
          {children}
        </div>
      </div>
    </main>
  );
}
