import { z } from "zod";
import type { SourceMetadata } from "./source-types";

// Schema for the Mihon-like manifest
export const MihonSourceManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseUrl: z.string().url(),
  lang: z.string().length(2).default("en"),
  version: z.string(),
  capabilities: z.array(z.string()).default([]),
  endpoints: z.object({
    popular: z.string().optional(),
    latest: z.string().optional(),
    search: z.string().optional(),
    detail: z.string().optional(),
    chapters: z.string().optional(),
    pages: z.string().optional(),
  }).optional(),
  nsfw: z.boolean().default(false),
  icon: z.string().optional(),
  manifestUrl: z.string().optional(),
});

export type MihonSourceManifest = z.infer<typeof MihonSourceManifestSchema>;

const STORAGE_KEY = "yomirra_dynamic_sources";

export class DynamicSourceRegistry {
  private getStorage(): Record<string, MihonSourceManifest> {
    if (typeof window === "undefined") return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setStorage(data: Record<string, MihonSourceManifest>) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Save minimal mapping for SSR
    const minimalData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v.manifestUrl) minimalData[k] = v.manifestUrl;
    }
    document.cookie = `${STORAGE_KEY}_urls=${encodeURIComponent(JSON.stringify(minimalData))}; path=/; max-age=31536000`;
  }

  async validateManifest(url: string): Promise<MihonSourceManifest> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch manifest");
      const data = await response.json();
      return MihonSourceManifestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error("Invalid manifest schema");
      }
      throw error;
    }
  }

  async install(manifestUrl: string): Promise<SourceMetadata> {
    const manifest = await this.validateManifest(manifestUrl);
    
    const storage = this.getStorage();
    if (storage[manifest.id]) {
      throw new Error("Source already installed");
    }

    manifest.manifestUrl = manifestUrl;
    storage[manifest.id] = manifest;
    this.setStorage(storage);

    return this.mapToMetadata(manifest);
  }

  async uninstall(sourceId: string): Promise<void> {
    const storage = this.getStorage();
    if (storage[sourceId]) {
      delete storage[sourceId];
      this.setStorage(storage);
    }
  }

  async updateSource(sourceId: string, overrides: { name?: string; icon?: string; manifestUrl?: string }): Promise<SourceMetadata> {
    const storage = this.getStorage();
    if (!storage[sourceId]) {
      throw new Error("Source not found");
    }

    if (overrides.manifestUrl && overrides.manifestUrl !== storage[sourceId].manifestUrl) {
      // Re-validate and fetch the new manifest
      const newManifest = await this.validateManifest(overrides.manifestUrl);
      
      // Preserve local overrides if they exist
      newManifest.name = overrides.name || storage[sourceId].name || newManifest.name;
      newManifest.icon = overrides.icon || storage[sourceId].icon || newManifest.icon;
      newManifest.manifestUrl = overrides.manifestUrl;
      
      storage[sourceId] = newManifest;
    } else {
      if (overrides.name !== undefined) storage[sourceId].name = overrides.name;
      if (overrides.icon !== undefined) storage[sourceId].icon = overrides.icon;
    }

    this.setStorage(storage);
    return this.mapToMetadata(storage[sourceId]);
  }

  getAll(): SourceMetadata[] {
    const storage = this.getStorage();
    return Object.values(storage).map(this.mapToMetadata);
  }

  get(id: string): SourceMetadata | undefined {
    const storage = this.getStorage();
    const manifest = storage[id];
    return manifest ? this.mapToMetadata(manifest) : undefined;
  }

  private mapToMetadata(manifest: MihonSourceManifest): SourceMetadata {
    return {
      id: manifest.id,
      name: manifest.name,
      description: `Custom source: ${manifest.baseUrl}`,
      language: manifest.lang,
      baseUrl: manifest.baseUrl,
      icon: manifest.icon,
      version: manifest.version,
      manifestUrl: manifest.manifestUrl,
      isEnabled: true,
      isInstalled: true,
      isNsfw: manifest.nsfw,
      capabilities: {
        popular: manifest.capabilities.includes("popular"),
        latest: manifest.capabilities.includes("latest"),
        search: manifest.capabilities.includes("search"),
        detail: manifest.capabilities.includes("detail"),
        chapters: manifest.capabilities.includes("chapters"),
        pages: manifest.capabilities.includes("pages"),
      },
    };
  }
}

export const dynamicSourceRegistry = new DynamicSourceRegistry();
