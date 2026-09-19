import { SourceMetadata } from "./source-types";

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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "120ms",
      lastChecked: "Baru saja",
      message: "Server berjalan normal tanpa kendala."
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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "286ms",
      lastChecked: "Baru saja",
      message: "Server merespons dengan baik."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "150ms",
      lastChecked: "Baru saja",
      message: "Server merespons dengan baik."
    },
    isNsfw: true,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "169ms",
      lastChecked: "Baru saja",
      message: "Server merespons dengan baik."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "180ms",
      lastChecked: "Baru saja",
      message: "Server merespons dengan baik."
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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "150ms",
      lastChecked: "Baru saja",
      message: "Server merespons dengan baik."
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
    status: "online",
    healthStats: {
      uptime: "99.9%",
      latency: "200ms",
      lastChecked: "Baru saja",
      message: "Server merespons dengan baik."
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
  }
];

import { dynamicSourceRegistry } from "./dynamic-source-registry";

export function getSourceMetadata(id: string): SourceMetadata | undefined {
  return sourceRegistry.find(s => s.id === id) || dynamicSourceRegistry.get(id);
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
export const pendingSourceRegistry: SourceMetadata[] = [];


export function getPendingSourceMetadata(id: string): SourceMetadata | undefined {
  return pendingSourceRegistry.find((s) => s.id === id);
}
