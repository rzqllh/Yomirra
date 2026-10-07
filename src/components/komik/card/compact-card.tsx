"use client";

import * as React from "react";
import { MangaCard } from "./manga-card";
import type { BaseCardProps } from "./types";
import type { SourceBinding } from "@/shared/lib/canonical-search";

export interface CompactCardProps extends BaseCardProps {
  showSourceBadge?: boolean;
  sourceBindings?: SourceBinding[];
  index?: number;
  animateReveal?: boolean;
  className?: string;
}

export function CompactCard(props: CompactCardProps) {
  return <MangaCard variant="discovery" viewMode="compact" {...props} />;
}
