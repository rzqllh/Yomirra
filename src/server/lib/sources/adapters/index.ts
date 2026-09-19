import type { MangaSource } from "@/shared/sources/source-types";
import { ShinigamiSource } from "./shinigami";
import { KomikindoSource } from "./komikindo";
import { MangaDexSource } from "./mangadex";
import { KomikuSource } from "./komiku";
import { KomikuIISource } from "./komiku-ii";

// Add new sources here
export const sources: MangaSource[] = [
  new ShinigamiSource(),
  new KomikindoSource(),
  new MangaDexSource(),
  new KomikuSource(),
  new KomikuIISource(),
];

export const sourceMap = new Map(sources.map((s) => [s.id, s]));
