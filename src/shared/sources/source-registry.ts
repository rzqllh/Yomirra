import { SourceMetadata } from "./source-types";
import { KEIYOUSHI_CANDIDATES, keiyoushiNeedsRestrictedOptIn } from "./keiyoushi-candidates";

// This is the shared representation of the registry.
export const sourceRegistry: SourceMetadata[] = [
  {
    id: "shinigami",
    name: "Shinigami",
    description: "Indonesian translation source for manga and manhwa.",
    language: "id",
    baseUrl: "https://shinigami.asia",
    healthCheckUrl: "https://api.shngm.io/v1/manga/list?page=1&page_size=1",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=shinigami.asia&sz=64",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    reportUrl: "https://discord.gg/shinigamid",
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: true,
    },
    isDynamic: false
  },
  {
    id: "komikindo",
    name: "Komikindo",
    description: "Baca Komik Bahasa Indonesia",
    language: "id",
    baseUrl: "https://komikindo.ch",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=komikindo.ch&sz=64",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    maintenance: { reason: "Server sumber menolak akses katalog dengan HTTP 403.", since: "2026-11-05T08:55:00.000Z" },
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: true,
    },
    isDynamic: false
  },
  {
    id: "mangadex",
    name: "MangaDex",
    description: "Largest international manga source with multi-language support.",
    language: "multi",
    baseUrl: "https://mangadex.org",
    icon: "https://mangadex.org/favicon.svg",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    // Mixed catalog: content-level filtering handles restricted titles.
    // Do not classify the whole source as restricted.
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: true,
    },
    healthCheckUrl: "https://api.mangadex.org/manga?limit=1",
    isDynamic: false
  },
  {
    id: "komiku",
    name: "Komiku",
    description: "Baca Komik, Manga, Manhwa, dan Manhua Bahasa Indonesia",
    language: "id",
    baseUrl: "https://komiku.org",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=komiku.org&sz=64",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
    },
    isDynamic: false
  },
  {
    id: "komiku-ii",
    name: "Komiku II",
    description: "REST API komik Bahasa Indonesia",
    language: "id",
    baseUrl: "https://01.komiku.asia",
    upstreamDomain: "01.komiku.asia",
    healthCheckUrl: "https://01.komiku.asia/api/v2/comics?page=1",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=01.komiku.asia&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: true,
    },
    isDynamic: false
  },
  {
    id: "asurascans",
    name: "Asura Scans",
    description: "Official Asura Scans English manga/manhwa",
    language: "en",
    baseUrl: "https://asurascans.com",
    upstreamDomain: "api.asurascans.com",
    healthCheckUrl: "https://api.asurascans.com/api/series?page=1",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=asurascans.com&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: true,
    },
    isDynamic: false
  },
  {
    id: "komiknesia",
    name: "KomikNesia",
    description: "Baca Komik Bahasa Indonesia (Encrypted API)",
    language: "id",
    baseUrl: "https://komiknesia.site",
    upstreamDomain: "api-be.komiknesia.my.id",
    healthCheckUrl: "https://api-be.komiknesia.my.id/api/contents?page=1&limit=1",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=komiknesia.site&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    maintenance: { reason: "Format sinopsis pada halaman pertama katalog belum kompatibel.", since: "2026-11-05T08:55:00.000Z" },
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
    },
    isDynamic: false
  },
  {
    id: "doujindesu",
    name: "Doujindesu",
    description: "Baca Doujinshi, Manga & Manhwa Bahasa Indonesia",
    language: "id",
    baseUrl: "https://doujin.desu.xxx",
    upstreamDomain: "doujin.desu.xxx",
    healthCheckUrl: "https://doujin.desu.xxx/api/manga?limit=1",
    icon: "https://pic.desu.xxx/content/web/1217a30e-c660-4212-9d80-548df7aa166d.webp",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: true,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: true,
    },
    isDynamic: false
  },
  {
    id: "westmanga",
    name: "WestManga",
    description: "Baca manga, manhwa & manhua online terlengkap bahasa Indonesia",
    language: "id",
    baseUrl: "https://v1.westmanga.my",
    upstreamDomain: "data.mantweh.online",
    healthCheckUrl: "https://data.mantweh.online/api/framework/config",
    icon: "https://assets.westmanga.site/images/static/logo.webp",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    maintenance: { reason: "Server sumber menolak akses katalog dengan HTTP 403.", since: "2026-11-05T08:55:00.000Z" },
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber belum diperiksa."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
    },
    isDynamic: false
  },
  {
    id: "manhwa-list",
    name: "Manhwa List",
    description: "Indonesian Manhwa & Manga Reader",
    language: "id",
    baseUrl: "https://m1.manhwalist.my.id",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=m1.manhwalist.my.id&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber aktif."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
      download: false,
      related: false,
    },
    isDynamic: false
  },
  {
    id: "izanamiscans",
    name: "Izanami Scans",
    description: "Izanami Scans Indonesian translations",
    language: "id",
    baseUrl: "https://izanamiscans.my.id",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=izanamiscans.my.id&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber aktif."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
      download: false,
      related: false,
    },
    isDynamic: false
  },
  {
    id: "kiryuu",
    name: "Kiryuu",
    description: "Kiryuu Indonesian manga reader",
    language: "id",
    baseUrl: "https://v7.kiryuu.to",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=v7.kiryuu.to&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber aktif."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
      download: false,
      related: false,
    },
    isDynamic: false
  },
  {
    id: "astral-scans",
    name: "Astral Scans",
    description: "Astral Scans translations",
    language: "id",
    baseUrl: "https://astralscans.site",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=astralscans.site&sz=64",
    version: "1.0.0",
    adapterVersion: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unknown",
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Belum diperiksa",
      message: "Status sumber aktif (NSFW opt-in)."
    },
    isNsfw: true,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
      download: false,
      related: false,
    },
    isDynamic: false
  }
];

import { dynamicSourceRegistry } from "./dynamic-source-registry";

export function getSourceMetadata(id: string): SourceMetadata | undefined {
  const normalizedId = id === "komikindoid" ? "komikindo" : id === "izanami-scans" ? "izanamiscans" : id;
  return sourceRegistry.find(s => s.id === normalizedId) || dynamicSourceRegistry.get(normalizedId);
}

export function getSourceDisplayName(id: string): string {
  const meta = getSourceMetadata(id);
  if (meta?.name) return meta.name;
  if (!id) return "";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function getAllSourceMetadata(): SourceMetadata[] {
  const dynamicSources = dynamicSourceRegistry.getAll();
  return [...sourceRegistry, ...dynamicSources];
}

/**
 * Pending sources scheduled for Phase 2 implementation.
 * Kept isolated from active `sourceRegistry` so they are not exposed to users
 * before their backend adapters are implemented and verified.
 */
export const pendingSourceRegistry: SourceMetadata[] = KEIYOUSHI_CANDIDATES
  .filter((candidate) => !sourceRegistry.some((s) => s.id === candidate.id))
  .map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    description: "Keiyoushi candidate: ported structurally, NOT live-verified",
    language: "id",
    baseUrl: candidate.baseUrl,
    version: "0.1.0-in-dev",
    isEnabled: false,
    isInstalled: true,
    status: "in-dev",
    isNsfw: keiyoushiNeedsRestrictedOptIn(candidate),
    capabilities: {
      popular: false, latest: false, search: false, detail: false,
      chapters: false, pages: false, filters: false,
    },
    isDynamic: false,
  }));


export function getPendingSourceMetadata(id: string): SourceMetadata | undefined {
  return pendingSourceRegistry.find((s) => s.id === id);
}
