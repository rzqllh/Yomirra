"use client";

import * as React from "react";
import { UnifiedFilterDrawer } from "@/components/shared/unified-filter-drawer";

export interface SearchFilterDrawerProps {
  children?: React.ReactNode;
  committedQuery?: string;
  onResetRouteIntent?: () => void;
}

export function SearchFilterDrawer({
  children,
  committedQuery = "",
  onResetRouteIntent,
}: SearchFilterDrawerProps) {
  return (
    <UnifiedFilterDrawer
      context="search"
      searchQuery={committedQuery}
      onResetRouteIntent={onResetRouteIntent}
      trigger={children}
    />
  );
}
