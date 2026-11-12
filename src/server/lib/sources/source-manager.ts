import type { MangaSource } from "@/shared/sources/source-types";
import { sourceMap, sources } from "./adapters";
import { DynamicSourceAdapter, fetchDynamicSourceJson } from "./adapters/dynamic";
import { DynamicSourceManifestSchema } from "@/shared/sources/dynamic-source-registry";
import { domainResolver } from "./domain-resolver";
import { SourceError } from "./error";


export class SourceManager {
  async getSource(
    id: string, 
    manifestUrl?: string | null,
    options?: { allowDisabled?: boolean }
  ): Promise<MangaSource> {
    const normalizedId = id.toLowerCase().trim();

    // Check admin override kill-switch
    if (!options?.allowDisabled) {
      try {
        const { getCoreSourceOverrides } = await import("./admin-source-service");
        const overrides = await getCoreSourceOverrides();
        const override = overrides[normalizedId];
        if (override && override.isEnabled === false) {
          throw new Error(`SOURCE_DISABLED: Source '${id}' is currently disabled by administrator.`);
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("SOURCE_DISABLED")) {
          throw err;
        }
        // Fail-open on Redis error
      }
    }
    if (manifestUrl) {
      if (sourceMap.has(normalizedId)) {
        throw new Error("SECURITY_REJECTED: Cannot use dynamic manifest with a built-in source identity.");
      }
      try {
        const { getCustomSourceById } = await import("./custom-source-service");
        if (await getCustomSourceById(normalizedId)) {
          throw new Error("SECURITY_REJECTED: Cannot use an external manifest with a registered source identity.");
        }
        const data = await fetchDynamicSourceJson(manifestUrl, normalizedId, "external", 256 * 1024);
        const manifest = DynamicSourceManifestSchema.parse(data);
        if (manifest.id !== id) {
          throw new Error(`SECURITY_REJECTED: Manifest identity mismatch. Expected ${id}, got ${manifest.id}`);
        }
        return new DynamicSourceAdapter(manifest, manifestUrl);
      } catch (err) {
        if (SourceError.isSourceError(err) || (err instanceof Error && err.message.startsWith("SECURITY_REJECTED"))) throw err;
        throw new Error(`Failed to initialize custom source: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    let source = sourceMap.get(normalizedId);
    if (!source) {
      try {
        const { getCustomSourceById } = await import("./custom-source-service");
        const custom = await getCustomSourceById(normalizedId);
        if (custom) {
          if (!options?.allowDisabled && custom.isEnabled === false) {
            throw new Error(`SOURCE_DISABLED: Source '${id}' is currently disabled by administrator.`);
          }
          if (custom.type === "html") {
            const { DynamicHtmlSourceAdapter } = await import("./adapters/dynamic/html-adapter");
            source = new DynamicHtmlSourceAdapter(custom);
          } else {
            source = new DynamicSourceAdapter({
              id: custom.id,
              name: custom.name,
              baseUrl: custom.baseUrl,
              lang: custom.lang,
              version: custom.version,
              capabilities: ["popular", "latest", "search", "detail", "chapters", "pages"],
              endpoints: custom.endpoints,
              nsfw: custom.isNsfw,
            });
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("SOURCE_DISABLED")) {
          throw err;
        }
        // ignore and let next check handle
      }
    }

    if (!source) {
      throw new Error(`Source ${id} not found`);
    }

    // D-001: Check runtime domain resolution without altering source identity
    try {
      const resolved = await domainResolver.resolveDomain(normalizedId, "frontend");
      if (resolved && typeof (source as any).setBaseUrl === "function" && source.baseUrl !== resolved) {
        (source as any).setBaseUrl(resolved);
      }
    } catch {
      // Preserve default adapter baseUrl on resolution error
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
