"use client";

import * as React from "react";
import { BookmarkPageView } from "@/components/bookmark/bookmark-page-view";
import { BookmarkSkeleton } from "@/components/skeletons/bookmark-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function BookmarkPage() {
  return (
    <React.Suspense
      fallback={
        <YomirraSurface variant="base" className="w-full">
          <PageContainer hasMobileHeader>
            <BookmarkSkeleton />
          </PageContainer>
        </YomirraSurface>
      }
    >
      <BookmarkPageView />
    </React.Suspense>
  );
}
