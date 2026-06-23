import type { MangaSource } from "@/shared/types/source";
import { ShinigamiSource } from "./shinigami";
import { KomikindoSource } from "./komikindo";
import { DoujindesuSource } from "./doujindesu";

// Add new sources here
export const sources: MangaSource[] = [
  new ShinigamiSource(),
  new KomikindoSource(),
  new DoujindesuSource(),
];

export const sourceMap = new Map(sources.map((s) => [s.id, s]));
