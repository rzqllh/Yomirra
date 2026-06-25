import type { MangaSource } from "@/shared/sources/source-types";
import { ShinigamiSource } from "./shinigami";
import { KomikindoSource } from "./komikindo";
import { WestMangaSource } from "./westmanga";
import { KomikuSource } from "./komiku";
import { KomikuAsiaSource } from "./komikuasia";

import { MangaDexSource, MangaDexNsfwSource } from "./mangadex";

// Add new sources here
export const sources: MangaSource[] = [
  new ShinigamiSource(),
  new KomikindoSource(),
  new WestMangaSource(),
  new KomikuSource(),
  new KomikuAsiaSource(),

  new MangaDexSource(),
  new MangaDexNsfwSource(),
];

export const sourceMap = new Map(sources.map((s) => [s.id, s]));
