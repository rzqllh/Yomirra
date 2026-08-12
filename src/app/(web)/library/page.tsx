"use client";

import * as React from "react";
import { LibraryPageView } from "@/components/library/library-page-view";
import { YomirraSurface } from "@/components/ui/layout";
import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";

export default function LibraryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
            <LibrarySkeleton />
          </YomirraSurface>
        </div>
      }
    >
      <LibraryPageView />
    </React.Suspense>
  );
}
