"use client";

import * as React from "react";
import { UnifiedFilterDrawer } from "@/components/shared/unified-filter-drawer";

export interface SearchFilterDrawerProps {
  children?: React.ReactNode;
}

export function SearchFilterDrawer({ children }: SearchFilterDrawerProps) {
  return <UnifiedFilterDrawer context="search" trigger={children} />;
}
