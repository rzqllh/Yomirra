"use client";

import * as React from "react";
import { BookmarkPageView } from "@/components/bookmark/bookmark-page-view";
import { BookmarkSkeleton } from "@/components/skeletons/bookmark-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function BookmarkPage() {
  return (
    <React.Suspense
      fallback={
        <Surface variant="base" className="w-full">
          <PageContainer hasMobileHeader>
            <BookmarkSkeleton />
          </PageContainer>
        </Surface>
      }
    >
      <BookmarkPageView />
    </React.Suspense>
  );
}
