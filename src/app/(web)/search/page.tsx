"use client";

import * as React from "react";
import { SearchPageView } from "@/components/search/search-page-view";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <YomirraSurface variant="base" className="w-full">
          <PageContainer>
            <SearchResultSkeleton />
          </PageContainer>
        </YomirraSurface>
      }
    >
      <SearchPageView />
    </React.Suspense>
  );
}
