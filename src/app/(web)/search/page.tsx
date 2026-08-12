"use client";

import * as React from "react";
import { SearchPageView } from "@/components/search/search-page-view";
import { PageHeader } from "@/components/app/header";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { MagnifyingGlass } from "@phosphor-icons/react";

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen bg-surface-base">
          <PageHeader
            title="Pencarian"
            description="Temukan komik dari berbagai sumber"
            icon={<MagnifyingGlass size={32} weight="duotone" />}
          />
          <div className="px-4 py-6">
            <SearchResultSkeleton />
          </div>
        </main>
      }
    >
      <SearchPageView />
    </React.Suspense>
  );
}
