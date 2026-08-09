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
