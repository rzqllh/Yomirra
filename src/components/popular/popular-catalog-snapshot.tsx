"use client";

import { PopularPageView, type PopularPageViewProps } from "./popular-page-view";
import { PopularPageSkeleton } from "@/components/skeletons/popular-skeleton";
import { useCatalogSnapshot, useRememberCatalogSnapshot } from "@/components/providers/catalog-snapshot";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { DestinationHeader } from "@/components/chrome/header";

export function PopularCatalogSnapshot({
  scope,
  ...data
}: PopularPageViewProps & { scope?: (string | undefined)[] }) {
  const unavailable = data.feeds.length > 0 && data.feeds.every((feed) => feed.loadFailed) && !data.mal;
  useRememberCatalogSnapshot("popular", unavailable ? undefined : scope, data);
  return <PopularPageView {...data} />;
}

export function PopularCatalogFallback() {
  const data = useCatalogSnapshot<PopularPageViewProps>("popular");
  if (!data) return <PopularPageSkeleton />;
  return (
    <Surface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <DestinationHeader destination="popular" />
        <PopularPageView {...data} />
      </PageContainer>
    </Surface>
  );
}
