"use client";

import * as React from "react"
import { useRouter, usePathname } from "next/navigation";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import { YomirraSurface } from "@/components/ui/yomirra-layout";
import { HomeSearchPill } from "./home-search-pill";
import { ContinueReadingList } from "./continue-reading-list";
import { cn } from "@/shared/utils/cn";

interface HomeViewProps {
  children?: React.ReactNode;
}

// ImmersiveHero removed based on user feedback

export function HomeView({ children }: HomeViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const _historyItemsState = useHistoryStore(state => state.items); // Subscribe to changes
  const historyItems = isMounted ? getContinueReading(10) : [];

  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <h1 className="sr-only">Beranda Yomirra</h1>
      
      <HomeSearchPill />
      
      <div className="px-4 pt-8 md:px-8 py-6 md:py-10 max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Lanjut Baca Section (Bento Scroll) */}
        <ContinueReadingList items={historyItems} />

        {/* Dynamic Source Feeds */}
        {children}
        
      </div>
    </YomirraSurface>
  );
}
