"use client";

import { HomeFeedClient, type HomeFeedClientProps } from "./home-feed-client";
import { SourceFeedSkeleton } from "./source-feed-skeleton";
import { usePathname } from "next/navigation";
import { useCatalogSnapshot, useRememberCatalogSnapshot } from "@/components/providers/catalog-snapshot";

export function HomeCatalogSnapshot({
  scope,
  ...data
}: HomeFeedClientProps & { scope?: (string | undefined)[] }) {
  useRememberCatalogSnapshot("home", data.catalogState === "unavailable" ? undefined : scope, data);
  return <HomeFeedClient {...data} />;
}

export function HomeCatalogFallback() {
  const pathname = usePathname();
  const data = useCatalogSnapshot<HomeFeedClientProps>("home");
  return pathname === "/" && data ? <HomeFeedClient {...data} /> : <SourceFeedSkeleton />;
}
