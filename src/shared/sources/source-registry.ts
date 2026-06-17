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
  }
];

export function getSourceMetadata(id: string): SourceMetadata | undefined {
  return sourceRegistry.find(s => s.id === id);
}

export function getAllSourceMetadata(): SourceMetadata[] {
  return sourceRegistry;
}
