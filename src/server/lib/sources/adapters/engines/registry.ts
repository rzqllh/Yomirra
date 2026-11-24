import type { MangaSource } from "@/shared/sources/source-types";
import { MangaThemesiaEngine } from "./mangathemesia";
import { NatsuIdEngine } from "./natsuid";
import { MadaraEngine } from "./madara";
import { GenericWpEngine } from "./generic-wp";
import { AinzScansSource } from "./ainz-scans";
import { AkumaSource } from "./akuma";
import { HentaiHandSource } from "./hentaihand";

/**
 * 27 Eligible Keiyoushi-Ported Source Adapters
 *
 * All newly integrated sources are strictly:
 * - isEnabled: false (disabled by default)
 * - status: "in-dev"
 * - capabilities.download: false
 * - accurate NSFW and MIXED classification with server-side safe-mode gates
 */
export const portedKeiyoushiSources: MangaSource[] = [
  // --- MangaThemesia Engine (11 sources) ---
  new MangaThemesiaEngine({
    id: "manhwa-list",
    name: "Manhwa List",
    description: "Indonesian Manhwa & Manga Reader",
    language: "id",
    baseUrl: "https://m1.manhwalist.my.id",
    category: "SFW",
    isNsfw: false,
    isEnabled: false,
    status: "in-dev",
  }),
  new MangaThemesiaEngine({
    id: "izanamiscans",
    name: "Izanami Scans",
    description: "Izanami Scans Indonesian translations",
    language: "id",
    baseUrl: "https://izanamiscans.my.id",
    category: "SFW",
    isNsfw: false,
    isEnabled: false,
    status: "in-dev",
  }),
  new MangaThemesiaEngine({
    id: "astral-scans",
    name: "Astral Scans",
    description: "Astral Scans translations",
    language: "id",
    baseUrl: "https://astralscans.site",
    category: "NSFW",
    isNsfw: true,
    isEnabled: false,
    status: "in-dev",
  }),
  new MangaThemesiaEngine({
    id: "dojing-net",
    name: "Dojing.net",
    description: "Indonesian doujinshi portal",
    language: "id",
    baseUrl: "https://dojing.net",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "doujinku",
    name: "Doujinku",
    description: "Doujinshi and adult comics reader",
    language: "id",
    baseUrl: "https://doujinku.org",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "kumapoi",
    name: "KumaPoi",
    description: "Adult manga and doujinshi reader",
    language: "id",
    baseUrl: "https://kumapoi.info",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "mangasusu",
    name: "Mangasusu",
    description: "Adult comic portal",
    language: "id",
    baseUrl: "https://mangasusuku.com",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "manhwadesu",
    name: "ManhwaDesu",
    description: "ManhwaDesu Indonesian reader",
    language: "id",
    baseUrl: "https://manhwadesu.wiki",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "manhwaland-mom",
    name: "ManhwaLand.mom",
    description: "ManhwaLand Indonesian portal",
    language: "id",
    baseUrl: "https://02.manhwaland.land",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "mihentai",
    name: "Mihentai",
    description: "Mihentai adult manga reader",
    language: "id",
    baseUrl: "https://mihentai.net",
    category: "NSFW",
    isNsfw: true,
  }),
  new MangaThemesiaEngine({
    id: "sekte-doujin",
    name: "Sekte Doujin",
    description: "Sekte Doujin Indonesian translation portal",
    language: "id",
    baseUrl: "https://sektedoujin.cc",
    category: "NSFW",
    isNsfw: true,
  }),

  // --- NatsuId / WordPress AJAX Engine (5 sources) ---
  new NatsuIdEngine({
    id: "cosmicscans",
    name: "CosmicScans",
    description: "CosmicScans comic translations",
    language: "id",
    baseUrl: "https://04.cosmicscans.to",
    category: "MIXED",
    isNsfw: false,
  }),
  new NatsuIdEngine({
    id: "kiryuu",
    name: "Kiryuu",
    description: "Kiryuu Indonesian manga reader",
    language: "id",
    baseUrl: "https://v7.kiryuu.to",
    category: "MIXED",
    isNsfw: false,
    isEnabled: false,
    status: "in-dev",
  }),
  new NatsuIdEngine({
    id: "manhwa-indo",
    name: "Manhwa Indo",
    description: "Manhwa Indo translations",
    language: "id",
    baseUrl: "https://www.manhwaindo.my",
    category: "MIXED",
    isNsfw: false,
  }),
  new NatsuIdEngine({
    id: "mikoroku",
    name: "MikoRoku",
    description: "MikoRoku reader portal",
    language: "id",
    baseUrl: "https://mikoroku.com",
    category: "MIXED",
    isNsfw: false,
  }),
  new NatsuIdEngine({
    id: "ryukomik",
    name: "Ryukomik",
    description: "Ryukomik adult reader",
    language: "id",
    baseUrl: "https://ryukomik.my.id",
    category: "NSFW",
    isNsfw: true,
  }),

  // --- Madara Engine (1 source) ---
  new MadaraEngine({
    id: "manhuarm",
    name: "Manhuarm",
    description: "Manhuarm machine translation and comics",
    language: "en",
    baseUrl: "https://manhuarmtl.com",
    category: "MIXED",
    isNsfw: false,
    supportedLanguages: ["en"],
  }),

  // --- Generic WP / ZManga / LoneSeal / OceanWP / ZeistManga (7 sources) ---
  new GenericWpEngine({
    id: "soul-scans",
    name: "Soul Scans",
    description: "Soul Scans Indonesian translations",
    language: "id",
    baseUrl: "https://v1.soulscans.org",
    category: "SFW",
    isNsfw: false,
  }),
  new GenericWpEngine({
    id: "crotpedia",
    name: "CrotPedia",
    description: "CrotPedia adult manga reader",
    language: "id",
    baseUrl: "https://crotpedia.net",
    category: "NSFW",
    isNsfw: true,
  }),
  new GenericWpEngine({
    id: "dreamteams-scans",
    name: "DreamTeams Scans",
    description: "DreamTeams adult scans portal",
    language: "id",
    baseUrl: "https://dreamteams.space",
    category: "NSFW",
    isNsfw: true,
  }),
  new GenericWpEngine({
    id: "hentai-crot",
    name: "Hentai Crot",
    description: "Hentai Crot reader portal",
    language: "id",
    baseUrl: "https://hentaicrot.com",
    category: "NSFW",
    isNsfw: true,
  }),
  new GenericWpEngine({
    id: "pix-hentai",
    name: "Pix Hentai",
    description: "Pix Hentai adult reader",
    language: "id",
    baseUrl: "https://pixhentai.com",
    category: "NSFW",
    isNsfw: true,
  }),
  new GenericWpEngine({
    id: "shiro-doujin",
    name: "Shiro Doujin",
    description: "Shiro Doujin reader",
    language: "id",
    baseUrl: "https://shirodoujin.com",
    category: "NSFW",
    isNsfw: true,
  }),
  new GenericWpEngine({
    id: "tooncubus",
    name: "Tooncubus",
    description: "Tooncubus adult comics",
    language: "en",
    baseUrl: "https://www.tooncubus.top",
    category: "NSFW",
    isNsfw: true,
    supportedLanguages: ["en"],
  }),

  // --- Dedicated REST / Custom APIs (3 sources) ---
  new AinzScansSource(),
  new AkumaSource(),
  new HentaiHandSource(),
];
