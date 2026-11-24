/**
 * Read-only candidate inventory derived from the owner-provided port-keiyoshi-ext.zip.
 * These are NOT verified working sources. They remain disabled/in-dev until
 * parser, content-classification, upstream and image-reader gates pass.
 * Existing Yomirra built-in sources are deliberately excluded.
 */
export type KeiyoushiCategory = "SFW" | "MIXED" | "NSFW";
export type KeiyoushiEngine = "html" | "natsuid" | "api";

export interface KeiyoushiCandidate {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly category: KeiyoushiCategory;
  readonly engine: KeiyoushiEngine;
  readonly zipDirectory: string;
}

export const KEIYOUSHI_CANDIDATES: readonly KeiyoushiCandidate[] = [
  { id: "ainzscansid", name: "Ainz Scans ID", baseUrl: "https://v3.ainzscans01.com", category: "SFW", engine: "api", zipDirectory: "ainz-scans-id" },
  { id: "akuma", name: "Akuma", baseUrl: "https://akuma.moe", category: "NSFW", engine: "html", zipDirectory: "akuma" },
  { id: "astral-scans", name: "Astral Scans", baseUrl: "https://astralscans.site", category: "NSFW", engine: "html", zipDirectory: "astral-scans" },
  { id: "cosmicscans", name: "CosmicScans", baseUrl: "https://04.cosmicscans.to", category: "MIXED", engine: "natsuid", zipDirectory: "cosmicscans" },
  { id: "crotpedia", name: "CrotPedia", baseUrl: "https://crotpedia.net", category: "NSFW", engine: "html", zipDirectory: "crotpedia" },
  { id: "dojing-net", name: "Dojing.net", baseUrl: "https://dojing.net", category: "NSFW", engine: "html", zipDirectory: "dojing-net" },
  { id: "doujinku", name: "Doujinku", baseUrl: "https://doujinku.org", category: "NSFW", engine: "html", zipDirectory: "doujinku" },
  { id: "dreamteams-scans", name: "DreamTeams Scans", baseUrl: "https://dreamteams.space", category: "NSFW", engine: "html", zipDirectory: "dreamteams-scans" },
  { id: "hentai-crot", name: "Hentai Crot", baseUrl: "https://hentaicrot.com", category: "NSFW", engine: "html", zipDirectory: "hentai-crot" },
  { id: "hentaihand", name: "HentaiHand", baseUrl: "https://hentaihand.com", category: "NSFW", engine: "html", zipDirectory: "hentaihand" },
  { id: "izanamiscans", name: "Izanami Scans", baseUrl: "https://izanamiscans.my.id", category: "SFW", engine: "html", zipDirectory: "izanami-scans" },
  { id: "kiryuu", name: "Kiryuu", baseUrl: "https://v7.kiryuu.to", category: "MIXED", engine: "natsuid", zipDirectory: "kiryuu" },
  { id: "komikindoid", name: "KomikIndoID", baseUrl: "https://komikindo.ch", category: "MIXED", engine: "natsuid", zipDirectory: "komikindoid" },
  { id: "kumapoi", name: "KumaPoi", baseUrl: "https://kumapoi.info", category: "NSFW", engine: "html", zipDirectory: "kumapoi" },
  { id: "manga-plus-by-shueisha", name: "MANGA Plus by SHUEISHA", baseUrl: "https://jumpg-webapi.tokyo-cdn.com/api", category: "SFW", engine: "api", zipDirectory: "manga-plus-by-shueisha" },
  { id: "mangasusu", name: "Mangasusu", baseUrl: "https://mangasusuku.com", category: "NSFW", engine: "html", zipDirectory: "mangasusu" },
  { id: "mangatoon-limited", name: "MangaToon (Limited)", baseUrl: "https://mangatoon.mobi/api", category: "SFW", engine: "api", zipDirectory: "mangatoon-limited" },
  { id: "manhuarm", name: "Manhuarm", baseUrl: "https://manhuarmtl.com", category: "MIXED", engine: "html", zipDirectory: "manhuarm" },
  { id: "manhwa-indo", name: "Manhwa Indo", baseUrl: "https://www.manhwaindo.my", category: "MIXED", engine: "natsuid", zipDirectory: "manhwa-indo" },
  { id: "manhwa-list", name: "Manhwa List", baseUrl: "https://m1.manhwalist.my.id", category: "SFW", engine: "html", zipDirectory: "manhwa-list" },
  { id: "manhwadesu", name: "ManhwaDesu", baseUrl: "https://manhwadesu.wiki", category: "NSFW", engine: "html", zipDirectory: "manhwadesu" },
  { id: "manhwaland-mom", name: "ManhwaLand.mom", baseUrl: "https://02.manhwaland.land", category: "NSFW", engine: "html", zipDirectory: "manhwaland-mom" },
  { id: "mihentai", name: "Mihentai", baseUrl: "https://mihentai.net", category: "NSFW", engine: "html", zipDirectory: "mihentai" },
  { id: "mikoroku", name: "MikoRoku", baseUrl: "https://mikoroku.com", category: "MIXED", engine: "natsuid", zipDirectory: "mikoroku" },
  { id: "pix-hentai", name: "Pix Hentai", baseUrl: "https://pixhentai.com", category: "NSFW", engine: "html", zipDirectory: "pix-hentai" },
  { id: "ryukomik", name: "Ryukomik", baseUrl: "https://ryukomik.my.id", category: "NSFW", engine: "natsuid", zipDirectory: "ryukomik" },
  { id: "sekte-doujin", name: "Sekte Doujin", baseUrl: "https://sektedoujin.cc", category: "NSFW", engine: "html", zipDirectory: "sekte-doujin" },
  { id: "shiro-doujin", name: "Shiro Doujin", baseUrl: "https://shirodoujin.com", category: "NSFW", engine: "html", zipDirectory: "shiro-doujin" },
  { id: "soul-scans", name: "Soul Scans", baseUrl: "https://v1.soulscans.org", category: "SFW", engine: "html", zipDirectory: "soul-scans" },
  { id: "tooncubus", name: "Tooncubus", baseUrl: "https://www.tooncubus.top", category: "NSFW", engine: "html", zipDirectory: "tooncubus" },
  { id: "webcomics", name: "Webcomics", baseUrl: "https://webcomicsapp.com", category: "SFW", engine: "html", zipDirectory: "webcomics" },
] as const;

export function keiyoushiNeedsRestrictedOptIn(source: KeiyoushiCandidate): boolean {
  // MIXED remains opt-in until item-level classification is verified.
  return source.category !== "SFW";
}

/** Reserve staged identities across hyphen/case variants without publishing them.
 * A reserved name is not a claim that a provider is approved or operational.
 */
const reservedCandidateIds = new Set(KEIYOUSHI_CANDIDATES.map(candidate => candidate.id.replace(/-/g, "")));

export function isReservedKeiyoushiId(id: unknown): boolean {
  return typeof id === "string" && reservedCandidateIds.has(id.trim().toLowerCase().replace(/-/g, ""));
}
