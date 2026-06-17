"use client";

import * as React from "react"
import { useRouter, usePathname } from "next/navigation";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import { YomirraSurface } from "@/components/ui/yomirra-layout";
import { HomeSearchPill } from "./home-search-pill";
import { ContinueReadingList } from "./continue-reading-list";
import { FloatingResumeDock } from "./floating-resume-dock";
import { cn } from "@/shared/utils/cn";

interface HomeViewProps {
  children?: React.ReactNode;
}

import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/yomirra-header";
import { Compass, MagnifyingGlass } from "@phosphor-icons/react";

export function HomeView({ children }: HomeViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isMounted, setIsMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const _historyItemsState = useHistoryStore(state => state.items); // Subscribe to changes
  const historyItems = isMounted ? getContinueReading(10) : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <h1 className="sr-only">Beranda Yomirra</h1>
      
      {/* Mobile Search Pill */}
      <HomeSearchPill />
      
      <div className="px-4 pt-8 md:px-8 py-6 md:py-10 max-w-7xl mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Unified Desktop Header */}
        <div className="flex flex-col gap-6">
          <DesktopPageTitle 
            title="Beranda" 
            description="Temukan dan baca komik favoritmu di satu tempat."
            icon={<Compass size={32} weight="duotone" />}
          />
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex w-full max-w-md items-center gap-2 rounded-full bg-surface-glass backdrop-blur-md px-4 h-[44px] transition-all duration-300 focus-within:bg-surface-glass focus-within:shadow-md border border-border-glass focus-within:border-accent-dim focus-within:ring-2 focus-within:ring-accent/50 shadow-sm"
          >
            <MagnifyingGlass className="size-4 text-text-muted shrink-0 transition-colors focus-within:text-accent" weight="bold" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari komik favoritmu..." 
              className="flex-1 bg-transparent text-base font-medium text-text-primary outline-none placeholder:text-text-muted/70"
            />
          </form>
        </div>

        {/* Lanjut Baca Section (Bento Scroll) */}
        <ContinueReadingList items={historyItems} />

        {/* Dynamic Source Feeds */}
        {children}
        
      </div>
      
      <FloatingResumeDock />
    </YomirraSurface>
  );
}
