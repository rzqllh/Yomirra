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
    const overridesMap = overrides as Record<string, any>;
    const builtInIds = new Set<string>();

    const mergedBuiltin: SourceMetadata[] = sourceRegistry.map((base) => {
      const normalizedBaseId = base.id.toLowerCase().trim();
      builtInIds.add(normalizedBaseId);

      const override = overridesMap[normalizedBaseId];
      if (!override) return { ...base };

      return {
        ...base,
        isEnabled: typeof override.isEnabled === "boolean" ? override.isEnabled : base.isEnabled,
        baseUrl: override.activeDomain || base.baseUrl,
      };
    });

    // 2. Map custom sources dari Redis (cegah shadow built-in & validasi format)
    const seenCustomIds = new Set<string>();
    const mappedCustom: SourceMetadata[] = [];

    for (const c of customSources || []) {
      if (!c || typeof c.id !== "string" || !c.name || !c.baseUrl) continue;
      const normalizedCustomId = c.id.toLowerCase().trim();
      if (!normalizedCustomId) continue;

      // Custom source tidak boleh menimpa ID built-in
      if (builtInIds.has(normalizedCustomId)) {
        logger.warn(`Custom source ID '${normalizedCustomId}' conflict dengan built-in source dan diabaikan`);
        continue;
      }

      if (seenCustomIds.has(normalizedCustomId)) continue;
      seenCustomIds.add(normalizedCustomId);

      mappedCustom.push({
        id: normalizedCustomId,
        name: String(c.name).trim(),
        description: `Custom source (${(c.type || "html").toUpperCase()})`,
        language: c.lang || "id",
        baseUrl: c.baseUrl,
        version: c.version || "1.0.0",
        isEnabled: typeof (c as any).isEnabled === "boolean" ? (c as any).isEnabled : true,
        isInstalled: true,
        status: "online" as const,
        isNsfw: Boolean(c.isNsfw),
        capabilities: {
          popular: true,
          latest: true,
          search: true,
          detail: true,
          chapters: true,
          pages: true,
          filters: false,
        },
        isDynamic: true,
      });
    }

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
  if (!id || typeof id !== "string") return null;
  const normalized = id.toLowerCase().trim();
  if (!normalized) return null;
  const sources = await getRuntimeSources();
  return sources.find((s) => s.id === normalized) || null;
}

/**
 * Pengecekan cepat apakah source tertentu aktif di level server.
 */
export async function isSourceEnabledServer(id: string): Promise<boolean> {
  const source = await getRuntimeSource(id);
  return source ? source.isEnabled : false;
}
