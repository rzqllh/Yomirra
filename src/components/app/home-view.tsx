"use client";

import * as React from "react"
import { useRouter, usePathname } from "next/navigation";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import { YomirraSurface } from "@/components/ui/yomirra-layout";
import { YomirraSearchField } from "@/components/ui/yomirra-search-field";
import { ContinueReadingList } from "./continue-reading-list";
import { cn } from "@/shared/utils/cn";

interface HomeViewProps {
  children?: React.ReactNode;
}

// ImmersiveHero removed based on user feedback

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
  const historyItems = isMounted ? getContinueReading(10) : [];

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

      <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Lanjut Baca Section (Bento Scroll) */}
        <ContinueReadingList items={historyItems} />

        {/* Dynamic Source Feeds */}
        {children}
        
      </div>
    </YomirraSurface>
  );
}
