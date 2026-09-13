"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Books } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { useLibraryCatalog } from "@/shared/hooks/use-library-catalog";
import { LibraryToolbar } from "./library-toolbar";
import { LibraryStatusRail } from "./library-status-rail";
import { LibraryCollectionRail } from "./library-collection-rail";
import { LibraryResults } from "./library-results";
import { KoleksiTab } from "./koleksi-tab";
import { RiwayatTab } from "./riwayat-tab";
import { UpdatesList } from "@/components/updates/updates-list";
import { LibraryTabs, type LibraryTab } from "./library-tabs";

// Sub-tabs will be migrated later:
// import { HistoryTab } from "./history-tab";
// import { UpdatesList } from "@/components/updates/updates-list";

export function LibraryPageView() {
  const catalog = useLibraryCatalog();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as LibraryTab) || "koleksi";

  if (!catalog.isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <LibrarySkeleton />
        </YomirraSurface>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Library Yomirra</h1>
      <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 md:py-8">
          {/* 1. Header Section */}
          <PageHeader
            title="Library"
            description="Koleksi komik dan riwayat bacaan favoritmu."
            icon={<Books size={32} weight="duotone" />}
            meta={<span className="text-sm font-bold text-text-muted">{catalog.totalLibraryCount} judul</span>}
          />

          {/* 2. Tabs */}
          <LibraryTabs />

          {/* 3. Tab Content */}
          {currentTab === "koleksi" && <KoleksiTab />}

          {currentTab === "riwayat" && <RiwayatTab />}

          {currentTab === "updates" && <UpdatesList />}
        </div>
      </YomirraSurface>
    </div>
  );
}
