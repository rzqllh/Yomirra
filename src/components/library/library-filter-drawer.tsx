"use client";

import * as React from "react";
import { UnifiedFilterDrawer } from "@/components/shared/unified-filter-drawer";

export interface LibraryFilterDrawerProps {
  children?: React.ReactNode;
  activeSourceId: string;
  onResetRouteIntent?: () => void;
}

export function LibraryFilterDrawer({
  children,
  activeSourceId,
  onResetRouteIntent,
}: LibraryFilterDrawerProps) {
  return (
    <UnifiedFilterDrawer
      context="library"
      activeSourceId={activeSourceId}
      onResetRouteIntent={onResetRouteIntent}
      trigger={children}
    />
  );
}
