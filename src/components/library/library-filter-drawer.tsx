"use client";

import * as React from "react";
import { UnifiedFilterDrawer } from "@/components/shared/unified-filter-drawer";

export interface LibraryFilterDrawerProps {
  children?: React.ReactNode;
  activeSourceId: string;
}

export function LibraryFilterDrawer({ children, activeSourceId }: LibraryFilterDrawerProps) {
  return (
    <UnifiedFilterDrawer
      context="library"
      activeSourceId={activeSourceId}
      trigger={children}
    />
  );
}
