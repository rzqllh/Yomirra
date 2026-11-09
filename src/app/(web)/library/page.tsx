"use client";

import * as React from "react";
import { LibraryPageView } from "@/components/library/library-page-view";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";

export default function LibraryPage() {
  return (
    <React.Suspense
      fallback={
        <Surface variant="base" className="w-full">
          <PageContainer hasMobileHeader>
            <LibrarySkeleton />
          </PageContainer>
        </Surface>
      }
    >
      <LibraryPageView />
    </React.Suspense>
  );
}
