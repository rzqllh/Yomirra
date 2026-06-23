import type { MangaSource } from "@/shared/sources/source-types";
import { sourceMap, sources } from "./adapters";
import { DynamicSourceAdapter } from "./adapters/dynamic";
import { MihonSourceManifestSchema } from "@/shared/sources/dynamic-source-registry";

export class SourceManager {
  async getSource(id: string, manifestUrl?: string | null): Promise<MangaSource> {
    if (manifestUrl) {
      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error("Failed to fetch custom manifest");
        const data = await res.json();
        const manifest = MihonSourceManifestSchema.parse(data);
        manifest.manifestUrl = manifestUrl;
        return new DynamicSourceAdapter(manifest);
      } catch (err) {
        throw new Error(`Failed to initialize custom source: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const source = sourceMap.get(id);
    if (!source) {
      throw new Error(`Source ${id} not found`);
    }
    return source;
  }

  getAllSources(): MangaSource[] {
    return sources;
  }

  getEnabledSources(enabledIds: string[]): MangaSource[] {
    return sources.filter((s) => enabledIds.includes(s.id));
  }
}

export const sourceManager = new SourceManager();
