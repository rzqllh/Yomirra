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
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    }
  },

  {
    id: "komiku",
    name: "Komiku",
    description: "Baca Komik, Manga, dan Manhwa",
    language: "id",
    baseUrl: "https://komiku.org",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=komiku.org&sz=64",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "in-fix",
    healthStats: {
      uptime: "99.9%",
      latency: "150ms",
      lastChecked: "Baru saja",
      message: "Server berjalan normal tanpa kendala."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    }
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
    }
  },
  {
    id: "komikuasia",
    name: "Komiku Asia",
    description: "Baca Komik Asia Terbaru",
    language: "id",
    baseUrl: "https://01.komiku.asia",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=01.komiku.asia&sz=64",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "in-fix",
    healthStats: {
      uptime: "0%",
      latency: "-",
      lastChecked: "Baru saja",
      message: "Akses ditolak oleh server (HTTP 403 Forbidden)."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    }
  },
  {
    id: "mangadex",
    name: "MangaDex",
    description: "Katalog manga terbesar dengan bahasa ID dan EN.",
    language: "id, en",
    baseUrl: "https://mangadex.org",
    healthCheckUrl: "https://api.mangadex.org/ping",
    icon: "https://mangadex.org/favicon.ico",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "in-fix",
    healthStats: {
      uptime: "99.9%",
      latency: "100ms",
      lastChecked: "Baru saja",
      message: "Server berjalan normal."
    },
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    }
  },
  {
    id: "mangadex-nsfw",
    name: "MangaDex (NSFW)",
    description: "Katalog manga erotica & pornographic (NSFW 18+).",
    language: "id, en",
    baseUrl: "https://mangadex.org",
    healthCheckUrl: "https://api.mangadex.org/ping",
    icon: "https://mangadex.org/favicon.ico",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "in-fix",
    healthStats: {
      uptime: "99.9%",
      latency: "100ms",
      lastChecked: "Baru saja",
      message: "Server berjalan normal."
    },
    isNsfw: true,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    }
  },
  {
    id: "westmanga",
    name: "West Manga",
    description: "Baca Manga, Manhwa, dan Manhua",
    language: "id",
    baseUrl: "https://westmanga.info",
    icon: "https://s2.googleusercontent.com/s2/favicons?domain=westmanga.info&sz=64",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "in-fix",
    isNsfw: false,
    healthStats: {
      uptime: "-",
      latency: "-",
      lastChecked: "Baru saja",
      message: "Koneksi diblokir oleh proteksi Cloudflare."
    },
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    }
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
