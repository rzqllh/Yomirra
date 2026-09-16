import type { MangaSource } from "@/shared/sources/source-types";
import { sourceMap, sources } from "./adapters";
import { DynamicSourceAdapter } from "./adapters/dynamic";
import { MihonSourceManifestSchema } from "@/shared/sources/dynamic-source-registry";

export class SourceManager {
  async getSource(id: string, manifestUrl?: string | null): Promise<MangaSource> {
    if (manifestUrl) {
      if (sourceMap.has(id)) {
        throw new Error("SECURITY_REJECTED: Cannot use dynamic manifest with a built-in source identity.");
      }
      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error("Failed to fetch custom manifest");
        const data = await res.json();
        const manifest = MihonSourceManifestSchema.parse(data);
        if (manifest.id !== id) {
          throw new Error(`SECURITY_REJECTED: Manifest identity mismatch. Expected ${id}, got ${manifest.id}`);
        }
        manifest.manifestUrl = manifestUrl;
        return new DynamicSourceAdapter(manifest);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("SECURITY_REJECTED")) throw err;
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
