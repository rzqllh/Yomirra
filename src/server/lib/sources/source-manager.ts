import type { MangaSource } from "@/shared/types/source";
import { sourceMap, sources } from "./adapters";

export class SourceManager {
  getSource(id: string): MangaSource {
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
