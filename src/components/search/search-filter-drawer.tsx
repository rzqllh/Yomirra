"use client";

import * as React from "react";
import { UnifiedFilterDrawer } from "@/components/shared/unified-filter-drawer";

export interface SearchFilterDrawerProps {
  children?: React.ReactNode;
  committedQuery?: string;
}

export function SearchFilterDrawer({
  children,
  committedQuery = "",
}: SearchFilterDrawerProps) {
  return (
    <UnifiedFilterDrawer
      context="search"
      searchQuery={committedQuery}
      trigger={children}
    />
  );
}
