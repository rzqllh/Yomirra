import { SourceMetadata } from "./source-types";

// This is the shared representation of the registry.
export const sourceRegistry: SourceMetadata[] = [
  {
    id: "shinigami",
    name: "Shinigami",
    description: "Indonesian translation source for manga and manhwa.",
    language: "id",
    baseUrl: "https://shngm.id",
    icon: "https://shngm.id/favicon.ico",
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
    icon: "https://i0.wp.com/komikindo.ch/wp-content/uploads/2020/12/fav.png?w=50",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "online",
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
    id: "doujindesu",
    name: "Doujindesu",
    description: "Baca Doujinshi Bahasa Indonesia (18+)",
    language: "id",
    baseUrl: "https://doujindesu.tv",
    icon: "https://doujindesu.tv/favicon.ico",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "unavailable",
    healthStats: {
      uptime: "0%",
      latency: "-",
      lastChecked: "Baru saja",
      message: "SSL Certificate Expired. Server utama sedang bermasalah."
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
