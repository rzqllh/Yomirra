"use client";

import * as React from "react";
import { LibraryPageView } from "@/components/library/library-page-view";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";

export default function LibraryPage() {
  return (
    <React.Suspense
      fallback={
        <YomirraSurface variant="base" className="w-full">
          <PageContainer>
            <LibrarySkeleton />
          </PageContainer>
        </YomirraSurface>
      }
    >
      <LibraryPageView />
    </React.Suspense>
  );
}
