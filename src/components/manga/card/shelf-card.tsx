"use client";

import * as React from "react";
import { MangaCard, type MangaCardProps } from "./manga-card";
import type { BaseCardProps } from "./types";
import type { SourceBinding } from "@/shared/lib/canonical-search";

export interface ShelfCardProps extends BaseCardProps {
  showSourceBadge?: boolean;
  sourceBindings?: SourceBinding[];
  index?: number;
  animateReveal?: boolean;
  className?: string;
}

export function ShelfCard(props: ShelfCardProps) {
  return <MangaCard variant="discovery" viewMode="grid" {...props} />;
}
