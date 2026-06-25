"use client";

import * as React from "react"
import { useRouter, usePathname } from "next/navigation";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import { YomirraSurface } from "@/components/ui/layout";
import { ContinueReadingList } from "./continue-reading-list";
import { cn } from "@/shared/utils/cn";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

interface HomeViewProps {
  children?: React.ReactNode;
}

import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { Compass, MagnifyingGlass } from "@phosphor-icons/react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

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
  const rawHistoryItems = isMounted ? getContinueReading(50) : [];

  const { isSourceDisabled } = useSourcePreferencesStore();
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const isGodMode = useSettingsStore(state => state.isGodMode);
  const nsfwSourceIds = useNsfwSourceIds();

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const historyItems = React.useMemo(() => {
    let result = rawHistoryItems.filter(item => {
      if (isSourceDisabled(item.sourceId)) return false;
      const source = dynamicSourceRegistry.get(item.sourceId);
      if (source && source.status === "unavailable") return false;
      return true;
    });
    if (!isGodMode) {
      result = result.filter(item => !isFromNsfwSource(item.sourceId, item.isNsfw));
    } else if (hideNsfw) {
      result = result.filter(item => !isFromNsfwSource(item.sourceId, item.isNsfw));
    }
    return result.slice(0, 10);
  }, [rawHistoryItems, isSourceDisabled, hideNsfw, isGodMode, isFromNsfwSource]);

  return (
    <PullToRefresh>
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
    </PullToRefresh>
  );
}

