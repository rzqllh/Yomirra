"use client";

import * as React from "react";
import { PageHeader } from "@/components/app/header";
import { SearchPageView } from "@/components/search/search-page-view";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <YomirraSurface variant="base" className="w-full">
          <PageContainer hasMobileHeader>
            <PageHeader
              title="Cari"
              subtitle="Cari judul dari semua sumber."
              hideDesktop
            />
            <SearchResultSkeleton />
          </PageContainer>
        </YomirraSurface>
      }
    >
      <SearchPageView />
    </React.Suspense>
  );
}
