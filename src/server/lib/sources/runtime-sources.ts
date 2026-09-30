import { sourceRegistry } from "@/shared/sources/source-registry";
import type { SourceMetadata } from "@/shared/sources/source-types";
import { getCoreSourceOverrides } from "@/server/lib/sources/admin-source-service";
import { getCustomSources } from "@/server/lib/sources/custom-source-service";
import { logger } from "@/shared/logger";

/**
 * Mengambil seluruh source metadata dengan runtime overrides dan custom sources dari Redis.
 * Dijamin fail-safe: jika Redis bermasalah, langsung fallback ke hardcoded baseline sourceRegistry.
 */
export async function getRuntimeSources(): Promise<SourceMetadata[]> {
  try {
    const [overrides, customSources] = await Promise.all([
      getCoreSourceOverrides().catch((err) => {
        logger.warn("Gagal memuat core source overrides dari Redis, fallback ke default", { err });
        return {};
      }),
      getCustomSources().catch((err) => {
        logger.warn("Gagal memuat custom sources dari Redis, fallback ke default", { err });
        return [];
      }),
    ]);

    // 1. Map built-in sources dengan runtime overrides
    const mergedBuiltin: SourceMetadata[] = sourceRegistry.map((base) => {
      const override = overrides[base.id.toLowerCase()];
      if (!override) return { ...base };

      return {
        ...base,
        isEnabled: typeof override.isEnabled === "boolean" ? override.isEnabled : base.isEnabled,
        baseUrl: override.activeDomain || base.baseUrl,
      };
    });

    // 2. Map custom sources dari Redis menjadi SourceMetadata
    const mappedCustom: SourceMetadata[] = (customSources || []).map((c) => ({
      id: c.id,
      name: c.name,
      description: `Custom source (${(c.type || "html").toUpperCase()})`,
      language: c.lang || "id",
      baseUrl: c.baseUrl,
      version: c.version || "1.0.0",
      isEnabled: typeof (c as any).isEnabled === "boolean" ? (c as any).isEnabled : true,
      isInstalled: true,
      status: "online" as const,
      isNsfw: c.isNsfw || false,
      capabilities: {
        popular: true,
        latest: true,
        search: true,
        detail: true,
        chapters: true,
        pages: true,
      },
      isDynamic: true,
    }));

    return [...mergedBuiltin, ...mappedCustom];
  } catch (error) {
    logger.error("Unhandled error di getRuntimeSources, fallback ke hardcoded sourceRegistry", { error });
    return [...sourceRegistry];
  }
}

/**
 * Mengambil satu source metadata berdasarkan ID (dengan runtime override).
 */
export async function getRuntimeSource(id: string): Promise<SourceMetadata | null> {
  const sources = await getRuntimeSources();
  const normalized = id.toLowerCase().trim();
  return sources.find((s) => s.id === normalized) || null;
}

/**
 * Pengecekan cepat apakah source tertentu aktif di level server.
 */
export async function isSourceEnabledServer(id: string): Promise<boolean> {
  const source = await getRuntimeSource(id);
  return source ? source.isEnabled : false;
}
