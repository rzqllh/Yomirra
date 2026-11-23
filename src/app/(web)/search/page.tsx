"use client";

import * as React from "react";
import { DestinationHeader } from "@/components/chrome/header";
import { SearchPageView } from "@/components/search/search-page-view";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <Surface variant="base" className="w-full">
          <PageContainer hasMobileHeader>
            <DestinationHeader destination="search" />
            <SearchResultSkeleton />
          </PageContainer>
        </Surface>
      }
    >
      <SearchPageView />
    </React.Suspense>
  );
}
