"use client";

import * as React from "react";
import { MangaCard } from "./manga-card";
import type { BaseCardProps } from "./types";

export interface EditorialCardProps extends BaseCardProps {
  rank?: number;
  index?: number;
  animateReveal?: boolean;
}

export function EditorialCard(props: EditorialCardProps) {
  return (
    <MangaCard
      variant="rank"
      sourceId={props.sourceId}
      manga={props.manga}
      priority={props.priority}
      displayScore={props.displayScore}
      rank={props.rank ?? props.manga.rank}
      latestChapterTime={props.manga.latestChapterTime}
      index={props.index}
      animateReveal={props.animateReveal}
    />
  );
}
