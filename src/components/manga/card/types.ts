import type { MangaItem } from "@/shared/types/source";

export interface BaseCardProps {
  manga: MangaItem;
  sourceId: string;
  priority?: boolean;
  displayScore?: number | null; // Passed down from parent to avoid N+1 fetches
}
