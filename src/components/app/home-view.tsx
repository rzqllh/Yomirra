"use client";

import * as React from "react"
import { useRouter, usePathname } from "next/navigation";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import { YomirraSurface } from "@/components/ui/layout";
import { ContinueReadingList } from "./continue-reading-list";
import { cn } from "@/shared/utils/cn";

interface HomeViewProps {
  children?: React.ReactNode;
}

import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { Compass, MagnifyingGlass } from "@phosphor-icons/react";

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
      

      <div className="px-4 pt-[calc(var(--safe-top)+24px)] md:px-8 pb-6 md:pb-10 max-w-7xl mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Unified Desktop Header */}
        <div className="flex flex-col gap-6 relative z-50">
          <DesktopPageTitle 
            title="Beranda" 
            description="Temukan dan baca komik favoritmu di satu tempat."
            icon={<Compass size={32} weight="duotone" />}
          />
        </div>

        {/* Lanjut Baca Section (Bento Scroll) */}
        <ContinueReadingList items={historyItems} />

        {/* Dynamic Source Feeds */}
        {children}
        
      </div>
    </YomirraSurface>
  );
}
