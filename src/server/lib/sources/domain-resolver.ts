import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";

export type DomainRole = "frontend" | "api" | "cdn";

export interface DomainRecord {
  sourceId: string;
  role: DomainRole;
  currentHost: string;
  verifiedAt: string;
  status: "verified" | "failed";
}

export interface SourceDomainConfig {
  sourceId: string;
  frontend: {
    defaultDomain: string;
    mirrors: string[];
  };
  api?: {
    defaultDomain: string;
    mirrors: string[];
  };
}

/**
 * Curated, verified mirror mappings per ADR D-001.
 * Unrestricted web search discovery is strictly prohibited.
 */
export const SOURCE_DOMAINS: Record<string, SourceDomainConfig> = {
  komikindo: {
    sourceId: "komikindo",
    frontend: {
      defaultDomain: "https://komikindo.ch",
      mirrors: ["https://komikindo.cv"],
    },
  },
  shinigami: {
    sourceId: "shinigami",
    frontend: {
      defaultDomain: "https://shinigami.asia",
      mirrors: ["https://11.shinigami.asia", "https://c.shinigami.asia"],
    },
    api: {
      defaultDomain: "https://api.shngm.io",
      mirrors: [],
    },
  },
  komiku: {
    sourceId: "komiku",
    frontend: {
      defaultDomain: "https://komiku.org",
      mirrors: [],
    },
    api: {
      defaultDomain: "https://api.komiku.org",
      mirrors: [],
    },
  },
  "komiku-ii": {
    sourceId: "komiku-ii",
    frontend: {
      defaultDomain: "https://01.komiku.asia",
      mirrors: [],
    },
    api: {
      defaultDomain: "https://01.komiku.asia/api/v2",
      mirrors: [],
    },
  },
  asurascans: {
    sourceId: "asurascans",
    frontend: {
      defaultDomain: "https://asurascans.com",
      mirrors: [],
    },
    api: {
      defaultDomain: "https://api.asurascans.com/api",
      mirrors: [],
    },
  },
  komiknesia: {
    sourceId: "komiknesia",
    frontend: {
      defaultDomain: "https://komiknesia.site",
      mirrors: [],
    },
    api: {
      defaultDomain: "https://api-be.komiknesia.my.id/api",
      mirrors: [],
    },
  },
  mangadex: {
    sourceId: "mangadex",
    frontend: {
      defaultDomain: "https://mangadex.org",
      mirrors: [],
    },
    api: {
      defaultDomain: "https://api.mangadex.org",
      mirrors: [],
    },
  },
};

const CACHE_TTL_SECONDS = 86400; // 24 hours
const memoryCache = new Map<string, DomainRecord>();

function getCacheKey(sourceId: string, role: DomainRole): string {
  return `yomirra:domain:${sourceId}:${role}`;
}

export class DomainResolver {
  /**
   * Resolves the active domain for a source following D-001:
   * 1. Explicit env configuration (e.g. SOURCE_KOMIKINDO_DOMAIN)
   * 2. Cached verified working domain (Redis / memory)
   * 3. Fallback verified mirror(s)
   * 4. Bundled default domain
   *
   * Note: Domain resolution NEVER mutates sourceId, reading progress, or library data.
   */
  async resolveDomain(sourceId: string, role: DomainRole = "frontend"): Promise<string> {
    const normalizedId = sourceId.toLowerCase().trim();
    const config = SOURCE_DOMAINS[normalizedId];

    const envKey = role === "api"
      ? `SOURCE_${normalizedId.replace(/-/g, "_").toUpperCase()}_API_DOMAIN`
      : `SOURCE_${normalizedId.replace(/-/g, "_").toUpperCase()}_DOMAIN`;

    const envDomain = process.env[envKey];
    if (envDomain && envDomain.trim()) {
      return envDomain.trim().replace(/\/+$/, "");
    }

    // Default if not in known config
    if (!config) {
      return "";
    }

    const targetConfig = role === "api" && config.api ? config.api : config.frontend;

    const cached = await this.getCachedDomain(normalizedId, role);
    if (cached && cached.status === "verified") {
      return cached.currentHost;
    }

    // 3 & 4. Return default domain from configuration
    return targetConfig.defaultDomain.replace(/\/+$/, "");
  }

  /**
   * Retrieves verified fallback mirrors for a source.
   */
  getFallbackMirrors(sourceId: string, role: DomainRole = "frontend"): string[] {
    const normalizedId = sourceId.toLowerCase().trim();
    const config = SOURCE_DOMAINS[normalizedId];
    if (!config) return [];
    const targetConfig = role === "api" && config.api ? config.api : config.frontend;
    return targetConfig.mirrors.map((m) => m.replace(/\/+$/, ""));
  }

  /**
   * Records a domain as verified working in cache.
   */
  async recordWorkingDomain(sourceId: string, domain: string, role: DomainRole = "frontend"): Promise<void> {
    const normalizedId = sourceId.toLowerCase().trim();
    const cleanDomain = domain.trim().replace(/\/+$/, "");
    const record: DomainRecord = {
      sourceId: normalizedId,
      role,
      currentHost: cleanDomain,
      verifiedAt: new Date().toISOString(),
      status: "verified",
    };

    const key = getCacheKey(normalizedId, role);
    memoryCache.set(key, record);

    if (redis) {
      try {
        await redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(record));
      } catch (err) {
        logger.warn("Failed to cache domain record in Redis", { key, error: err });
      }
    }

  }

  /**
   * Marks a domain as failed and attempts to resolve a fallback mirror.
   * Returns the next recommended mirror, or null if all mirrors are exhausted.
   */
  async markDomainFailed(sourceId: string, failedDomain: string, role: DomainRole = "frontend"): Promise<string | null> {
    const normalizedId = sourceId.toLowerCase().trim();
    const cleanFailed = failedDomain.trim().replace(/\/+$/, "");
    const mirrors = this.getFallbackMirrors(normalizedId, role);
    const config = SOURCE_DOMAINS[normalizedId];
    const defaultDomain = (role === "api" && config?.api ? config.api.defaultDomain : config?.frontend.defaultDomain)?.replace(/\/+$/, "");

    logger.warn(`Domain failure reported for source ${normalizedId} [${role}]: ${cleanFailed}`);

    // Look for an alternate mirror that is not the failed domain
    const candidate = mirrors.find((m) => m.toLowerCase() !== cleanFailed.toLowerCase());

    if (candidate) {
      logger.info(`Switching source ${normalizedId} [${role}] to fallback mirror: ${candidate}`);
      await this.recordWorkingDomain(normalizedId, candidate, role);
      return candidate;
    }

    if (defaultDomain && defaultDomain.toLowerCase() !== cleanFailed.toLowerCase()) {
      await this.recordWorkingDomain(normalizedId, defaultDomain, role);
      return defaultDomain;
    }

    // No alternative mirrors available
    const key = getCacheKey(normalizedId, role);
    const failedRecord: DomainRecord = {
      sourceId: normalizedId,
      role,
      currentHost: cleanFailed,
      verifiedAt: new Date().toISOString(),
      status: "failed",
    };
    memoryCache.set(key, failedRecord);

    return null;
  }

  async getCachedDomain(sourceId: string, role: DomainRole = "frontend"): Promise<DomainRecord | null> {
    const key = getCacheKey(sourceId.toLowerCase().trim(), role);

    if (redis) {
      try {
        const raw = await redis.get(key);
        if (raw) {
          return typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as DomainRecord);
        }
      } catch {
        // Fall back to memoryCache
      }
    }

    return memoryCache.get(key) || null;
  }

  async resetDomainCache(sourceId?: string): Promise<void> {
    if (sourceId) {
      const normalizedId = sourceId.toLowerCase().trim();
      for (const role of ["frontend", "api", "cdn"] as DomainRole[]) {
        const key = getCacheKey(normalizedId, role);
        memoryCache.delete(key);
        if (redis) await redis.del(key).catch(() => {});
      }
    } else {
      memoryCache.clear();
    }
  }
}

export const domainResolver = new DomainResolver();
