"use client";

import * as React from "react"
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import { YomirraSurface, YomirraSection } from "@/components/ui/yomirra-layout";
import { YomirraSearchField } from "@/components/ui/yomirra-search-field";
import { MangaCard } from "@/components/manga/manga-card";
import { cn } from "@/shared/utils/cn";

interface HomeViewProps {
  children: React.ReactNode;
}

export function HomeView({ children }: HomeViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");
  
  const [isMounted, setIsMounted] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const _historyItemsState = useHistoryStore(state => state.items); // Subscribe to changes
  const historyItems = isMounted ? getContinueReading(4) : [];

  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <h1 className="sr-only">Beranda Yomirra</h1>
      
      {/* Editorial Header / Search */}
      <div className={cn(
        "md:hidden sticky top-0 z-[var(--z-sticky)] px-4 pt-[calc(var(--safe-top)+12px)] pb-3 transition-all duration-300 ease-out pointer-events-none",
        scrolled 
          ? "bg-surface-glass backdrop-blur-md border-b border-border-glass shadow-sm"
          : "bg-transparent border-transparent shadow-none"
      )}>
        <div className="transition-all duration-300 ease-out pointer-events-auto">
        <h2 className="text-[22px] font-black tracking-tight text-text-primary mb-3">
          Temukan
        </h2>
        <YomirraSearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSubmitAction={(e, val) => {
            if (val.trim()) router.push(`/search?q=${encodeURIComponent(val.trim())}`);
          }}
          placeholder="Cari komik favoritmu..."
        />
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 md:py-10 space-y-12 max-w-7xl mx-auto">
        
        {/* Lanjut Baca Section */}
        {historyItems.length > 0 && (
          <YomirraSection 
            title="Lanjut Baca" 
            action={
              <Link href="/bookmark" className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors">
                Riwayat
              </Link>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {historyItems.map((item, index) => (
                <MangaCard 
                  key={`${item.sourceId}::${item.mangaId}::${item.chapterId}`}
                  variant="history"
                  sourceId={item.sourceId}
                  manga={{
                    id: item.mangaId,
                    title: item.mangaTitle,
                    coverUrl: item.coverUrl || "",
                    latestChapter: item.chapterTitle,
                    latestChapterTime: new Date(item.readAt).toISOString()
                  }}
                  chapterId={item.chapterId}
                  chapterTitle={item.chapterTitle}
                  progressPercent={item.progressPercent}
                  priority={index === 0}
                />
              ))}
            </div>
          </YomirraSection>
        )}

        {/* Dynamic Source Feeds */}
        {children}
        
      </div>
    </YomirraSurface>
  );
}
