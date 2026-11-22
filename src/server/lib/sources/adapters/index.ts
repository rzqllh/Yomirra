import type { MangaSource } from "@/shared/sources/source-types";
import { ShinigamiSource } from "./shinigami";
import { KomikindoSource } from "./komikindo";
import { MangaDexSource } from "./mangadex";
import { KomikuSource } from "./komiku";
import { KomikuIISource } from "./komiku-ii";
import { AsuraScansSource } from "./asurascans";
import { KomikNesiaSource } from "./komiknesia";
import { DoujinDesuSource } from "./doujindesu";
import { WestMangaSource } from "./westmanga";
import { MangaThemesiaEngine } from "./engines/mangathemesia";

// Canonical Yomirra baseline sources (9 built-ins)
export const builtInSources: MangaSource[] = [
  new ShinigamiSource(),
  new KomikindoSource(),
  new MangaDexSource(),
  new KomikuSource(),
  new KomikuIISource(),
  new AsuraScansSource(),
  new KomikNesiaSource(),
  new DoujinDesuSource(),
  new WestMangaSource(),
];

// Verified Keiyoushi-ported sources promoted to active status
export const manhwaListSource = new MangaThemesiaEngine({
  id: "manhwa-list",
  name: "Manhwa List",
  description: "Indonesian Manhwa & Manga Reader",
  language: "id",
  baseUrl: "https://m1.manhwalist.my.id",
  category: "SFW",
  isNsfw: false,
  isEnabled: true,
  status: "unknown",
});

// Active sources exposed to public discovery
export const sources: MangaSource[] = [
  ...builtInSources,
  manhwaListSource,
];

export const sourceMap = new Map(sources.map((s) => [s.id, s]));

