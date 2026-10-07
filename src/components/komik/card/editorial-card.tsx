"use client";

import * as React from "react";
import { MangaCard } from "./manga-card";
import type { BaseCardProps } from "./types";
import type { SourceBinding } from "@/shared/lib/canonical-search";

export interface EditorialCardProps extends BaseCardProps {
  rank?: number;
  index?: number;
  animateReveal?: boolean;
  sourceBindings?: SourceBinding[];
}

export function EditorialCard(props: EditorialCardProps) {
  return (
    <MangaCard
      variant="rank"
      sourceId={props.sourceId}
      manga={props.manga}
      priority={props.priority}
      displayScore={props.displayScore}
      sourceBindings={props.sourceBindings}
      rank={props.rank ?? props.manga.rank}
      latestChapterTime={props.manga.latestChapterTime}
      index={props.index}
      animateReveal={props.animateReveal}
    />
  );
}
