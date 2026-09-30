import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import { DEFAULT_SITE_CONFIG, type SiteConfig } from "@/shared/types/site-config";

const SITE_CONFIG_KEY = "yomirra:site:config";

let inMemoryConfig: SiteConfig = { ...DEFAULT_SITE_CONFIG };

export async function getSiteConfig(): Promise<SiteConfig> {
  if (redis) {
    try {
      const raw = await redis.get(SITE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Deep merge with defaults to protect against missing keys
        return {
          ...DEFAULT_SITE_CONFIG,
          ...parsed,
          announcement: {
            ...DEFAULT_SITE_CONFIG.announcement,
            ...(parsed.announcement || {}),
          },
          maintenanceMode: {
            ...DEFAULT_SITE_CONFIG.maintenanceMode,
            ...(parsed.maintenanceMode || {}),
          },
          spotlight: {
            ...DEFAULT_SITE_CONFIG.spotlight,
            ...(parsed.spotlight || {}),
          },
          features: {
            ...DEFAULT_SITE_CONFIG.features,
            ...(parsed.features || {}),
          },
        };
      }
    } catch (err) {
      logger.warn("Failed to get site config from Redis, using fallback", { err });
    }
  }

  return inMemoryConfig;
}

export async function updateSiteConfig(partial: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getSiteConfig();
  const next: SiteConfig = {
    ...current,
    ...partial,
    announcement: partial.announcement
      ? { ...current.announcement, ...partial.announcement }
      : current.announcement,
    maintenanceMode: partial.maintenanceMode
      ? { ...current.maintenanceMode, ...partial.maintenanceMode }
      : current.maintenanceMode,
    spotlight: partial.spotlight
      ? { ...current.spotlight, ...partial.spotlight }
      : current.spotlight,
    features: partial.features
      ? { ...current.features, ...partial.features }
      : current.features,
    updatedAt: new Date().toISOString(),
  };

  inMemoryConfig = next;

  if (redis) {
    try {
      await redis.set(SITE_CONFIG_KEY, JSON.stringify(next));
    } catch (err) {
      logger.error("Failed to persist site config to Redis", { err });
    }
  }

  return next;
}
