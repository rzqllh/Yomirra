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
import { NatsuIdEngine } from "./engines/natsuid";

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

export const izanamiScansSource = new MangaThemesiaEngine({
  id: "izanamiscans",
  name: "Izanami Scans",
  description: "Izanami Scans Indonesian translations",
  language: "id",
  baseUrl: "https://izanamiscans.my.id",
  category: "SFW",
  isNsfw: false,
  isEnabled: true,
  status: "unknown",
});

export const kiryuuSource = new NatsuIdEngine({
  id: "kiryuu",
  name: "Kiryuu",
  description: "Kiryuu Indonesian manga reader",
  language: "id",
  baseUrl: "https://v7.kiryuu.to",
  category: "MIXED",
  isNsfw: false,
  isEnabled: true,
  status: "unknown",
});

export const astralScansSource = new MangaThemesiaEngine({
  id: "astral-scans",
  name: "Astral Scans",
  description: "Astral Scans translations",
  language: "id",
  baseUrl: "https://astralscans.site",
  category: "NSFW",
  isNsfw: true,
  isEnabled: true,
  status: "unknown",
});

// Active sources exposed to public discovery
export const sources: MangaSource[] = [
  ...builtInSources,
  manhwaListSource,
  izanamiScansSource,
  kiryuuSource,
  astralScansSource,
];

export const sourceMap = new Map(sources.map((s) => [s.id, s]));

// Canonical aliases
const komikindoInstance = sourceMap.get("komikindo");
if (komikindoInstance) {
  sourceMap.set("komikindoid", komikindoInstance);
}
sourceMap.set("izanami-scans", izanamiScansSource);


