import type { MangaSource } from "@/shared/types/source";
import { ShinigamiSource } from "./shinigami";

// Add new sources here
export const sources: MangaSource[] = [
  new ShinigamiSource(),
];

export const sourceMap = new Map(sources.map((s) => [s.id, s]));
