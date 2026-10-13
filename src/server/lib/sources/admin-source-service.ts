import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import * as domainResolverModule from "@/server/lib/sources/domain-resolver";
import { isRedisConfigured, isRedisReady, redis, ensureRedisReady } from "@/server/lib/cache/redis";
import { deleteMatchedRedisKeys } from "@/server/lib/sources/custom-source-service";
import { logger } from "@/shared/logger";
import { sourceManager } from "@/server/lib/sources/source-manager";
import type { SourceHealthMatrixItem } from "@/shared/types/admin";

export interface ProbeResult {
  sourceId: string;
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  message?: string;
  itemCount?: number;
}

export interface CoreSourceOverride {
  id: string;
  isEnabled?: boolean;
  activeDomain?: string;
  mirrors?: string[];
  rateLimit?: number;
  updatedAt?: string;
}

const CORE_OVERRIDES_KEY = "yomirra:sources:core:overrides";

let inMemoryCoreOverrides: Record<string, CoreSourceOverride> = {};

export function _resetAdminSourceServiceForTesting(): void {
  inMemoryCoreOverrides = {};
}

/**
 * Membaca core source overrides secara durabel dari Redis untuk mutasi admin (fail-closed).
 */
export async function getDurableCoreSourceOverrides(): Promise<Record<string, CoreSourceOverride>> {
  if (!isRedisConfigured) {
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      throw new Error("Failed to read core source overrides: durable storage is required in production");
    }
    return inMemoryCoreOverrides;
  }

  await ensureRedisReady();
  const raw = await redis.get(CORE_OVERRIDES_KEY);
  if (!raw) {
    inMemoryCoreOverrides = {};
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid core source overrides structure: expected object dictionary");
    }
    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (item && typeof item === "object" && item.mirrors && !Array.isArray(item.mirrors)) {
        item.mirrors = [];
      }
    }
    inMemoryCoreOverrides = parsed;
    return parsed;
  } catch (err) {
    logger.error("Corrupted core source overrides in Redis", { err });
    throw new Error("Failed to parse core source overrides from durable storage", { cause: err });
  }
}

/**
 * Mengambil core source overrides untuk consumer publik/pembaca (fail-open graceful fallback).
 */
export async function getCoreSourceOverrides(): Promise<Record<string, CoreSourceOverride>> {
  if (!isRedisConfigured) return inMemoryCoreOverrides;

  if (!isRedisReady()) {
    void ensureRedisReady().catch(() => {});
    return inMemoryCoreOverrides;
  }

  try {
    const raw = await redis.get(CORE_OVERRIDES_KEY);
    if (!raw) {
      // Authoritative miss from Redis: evict cached overrides so deleted records are not resurrected
      inMemoryCoreOverrides = {};
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return inMemoryCoreOverrides;
    }
    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (item && typeof item === "object" && item.mirrors && !Array.isArray(item.mirrors)) {
        item.mirrors = [];
      }
    }
    inMemoryCoreOverrides = parsed;
    return parsed;
  } catch {
    return inMemoryCoreOverrides;
  }
}

const SAVE_CORE_OVERRIDE_LUA = `
local raw = redis.call('get', KEYS[1])
local current = {}
if raw then
  if not raw:match('^%s*%{') then
    return redis.error_reply('ERR_CORRUPTED_CORE_OVERRIDES')
  end
  local ok, decoded = pcall(cjson.decode, raw)
  if not ok or not decoded or type(decoded) ~= 'table' or #decoded > 0 then
    return redis.error_reply('ERR_CORRUPTED_CORE_OVERRIDES')
  end
  current = decoded
end

local existing = current[ARGV[1]]
if not existing or type(existing) ~= 'table' then
  existing = { id = ARGV[1] }
end

local ok2, incoming = pcall(cjson.decode, ARGV[2])
if ok2 and incoming then
  for k, v in pairs(incoming) do
    existing[k] = v
  end
end

existing['id'] = ARGV[1]
existing['updatedAt'] = ARGV[3]

current[ARGV[1]] = existing

local enc = cjson.encode(current)
enc = string.gsub(enc, '"mirrors":%s*{}', '"mirrors":[]')

redis.call('set', KEYS[1], enc)

if ARGV[4] and ARGV[4] ~= '' and ARGV[5] and ARGV[5] ~= '' then
  redis.call('set', ARGV[4], ARGV[5], 'EX', 2592000)
end

local existing_enc = cjson.encode(existing)
existing_enc = string.gsub(existing_enc, '"mirrors":%s*{}', '"mirrors":[]')

return '{"current":' .. enc .. ',"updated":' .. existing_enc .. '}'
`;

/**
 * Menyimpan core source override dengan fail-closed durability dan proteksi concurrency atomik.
 */
export async function saveCoreSourceOverride(
  sourceId: string,
  override: Partial<CoreSourceOverride>
): Promise<CoreSourceOverride> {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && !isRedisConfigured) {
    logger.error("Admin core source override mutation rejected: Redis durable storage is required in production");
    throw new Error("Failed to persist core source override: durable storage is required in production");
  }

  const normId = sourceId.toLowerCase().trim();

  if (isRedisConfigured) {
    await ensureRedisReady();

    const domainKey = override.activeDomain ? `yomirra:domain:${normId}:frontend` : "";
    const domainVal = override.activeDomain
      ? JSON.stringify({
          sourceId: normId,
          role: "frontend",
          currentHost: override.activeDomain.replace(/\/+$/, ""),
          verifiedAt: new Date().toISOString(),
          status: "verified",
        })
      : "";

    const updatedAt = new Date().toISOString();

    try {
      const res = await redis.eval(
        SAVE_CORE_OVERRIDE_LUA,
        1,
        CORE_OVERRIDES_KEY,
        normId,
        JSON.stringify(override),
        updatedAt,
        domainKey,
        domainVal
      );

      const parsedRes: unknown = typeof res === "string" ? JSON.parse(res) : res;
      let fullMap: Record<string, CoreSourceOverride> = {};
      let updated: CoreSourceOverride;

      if (parsedRes && typeof parsedRes === "object" && "current" in parsedRes && "updated" in parsedRes) {
        const container = parsedRes as {
          current?: Record<string, CoreSourceOverride>;
          updated?: CoreSourceOverride;
        };
        fullMap = container.current || {};
        updated = container.updated || { id: normId };
      } else {
        updated = (parsedRes as CoreSourceOverride) || { id: normId };
        fullMap = { ...inMemoryCoreOverrides, [normId]: updated };
      }

      for (const key of Object.keys(fullMap)) {
        const item = fullMap[key];
        if (item && typeof item === "object" && item.mirrors && !Array.isArray(item.mirrors)) {
          item.mirrors = [];
        }
      }
      inMemoryCoreOverrides = fullMap;

      if (updated && updated.mirrors && !Array.isArray(updated.mirrors)) {
        updated.mirrors = [];
      }
      return updated;
    } catch (err) {
      logger.error("Failed to persist core source override to Redis", { normId, err });
      throw new Error("Failed to persist core source override to durable storage", { cause: err });
    }
  }

  // Development/test memory fallback
  const existing = inMemoryCoreOverrides[normId] || { id: normId };
  const updated: CoreSourceOverride = {
    ...existing,
    ...override,
    id: normId,
    updatedAt: new Date().toISOString(),
  };
  if (updated.mirrors && !Array.isArray(updated.mirrors)) {
    updated.mirrors = [];
  }
  inMemoryCoreOverrides[normId] = updated;
  return updated;
}

export async function getSourceHealthMatrix(): Promise<SourceHealthMatrixItem[]> {
  const sources = getAllSourceMetadata();
  let snapshots: Record<string, any> = {};
  const coreOverrides = await getCoreSourceOverrides();

  if (typeof sourceHealthStore.getAllSnapshots === "function") {
    snapshots = await sourceHealthStore.getAllSnapshots(sources.map((s) => s.id));
  } else if (typeof (sourceHealthStore as any).getHealth === "function") {
    for (const s of sources) {
      snapshots[s.id] = (sourceHealthStore as any).getHealth(s.id);
    }
  }

  return Promise.all(
    sources.map(async (meta) => {
      const snapshot = snapshots[meta.id];
      const override = coreOverrides[meta.id.toLowerCase()];

      let activeDomain = override?.activeDomain || meta.baseUrl || "";
      if (!override?.activeDomain) {
        try {
          const resolver = (domainResolverModule as any).domainResolver;
          if (resolver && typeof resolver.resolveDomain === "function") {
            activeDomain = await resolver.resolveDomain(meta.id);
          } else if (resolver && typeof resolver.resolve === "function") {
            activeDomain = resolver.resolve(meta.id);
          }
        } catch {
          activeDomain = meta.baseUrl || "";
        }
      }

      let mirrors: string[] = Array.isArray(override?.mirrors) ? override.mirrors : [];
      if (mirrors.length === 0) {
        try {
          const domains = (domainResolverModule as any).SOURCE_DOMAINS;
          if (domains && domains[meta.id.toLowerCase()]) {
            mirrors = domains[meta.id.toLowerCase()]?.frontend?.mirrors || [];
          }
        } catch {
          mirrors = [];
        }
      }

      const isEnabled = typeof override?.isEnabled === "boolean" ? override.isEnabled : meta.isEnabled;

      let status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNMEASURED" = "UNMEASURED";
      if (!isEnabled) {
        status = "DOWN";
      } else if (snapshot) {
        if (snapshot.status === "HEALTHY") status = "HEALTHY";
        else if (snapshot.status === "DEGRADED") status = "DEGRADED";
        else status = "DOWN";
      } else if (meta.status === "online") {
        status = "HEALTHY";
      }

      return {
        id: meta.id,
        name: meta.name,
        isEnabled,
        isInstalled: meta.isInstalled,
        status,
        healthStatus: snapshot?.status || (isEnabled ? "HEALTHY" : "DOWN"),
        consecutiveFailures: snapshot?.consecutiveFailures ?? 0,
        latencyMs: snapshot?.latencyMs ?? 0,
        lastCheckedAt: snapshot?.lastCheckedAt,
        mirrors,
        activeDomain: activeDomain || meta.baseUrl || "",
        upstreamDomain: meta.upstreamDomain || meta.baseUrl || "",
      };
    })
  );
}

export async function probeSource(sourceId: string): Promise<ProbeResult> {
  const start = performance.now();
  try {
    const source = await sourceManager.getSource(sourceId);
    const popular = await source.getPopular(1);
    const latencyMs = Math.round(performance.now() - start);
    const itemCount = popular?.mangas?.length ?? 0;

    return {
      sourceId,
      success: true,
      latencyMs,
      statusCode: 200,
      itemCount,
      message: `Berhasil memuat ${itemCount} judul manga`,
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    logger.warn(`Admin probe failed for ${sourceId}`, { error });
    return {
      sourceId,
      success: false,
      latencyMs,
      statusCode: error?.statusCode || 500,
      message: error?.message || "Probe request failed",
    };
  }
}

export async function flushSourceCache(sourceId?: string): Promise<{ success: boolean; message: string; flushedCount: number; deletedCount: number }> {
  if (!isRedisConfigured) {
    return { success: true, message: "Redis unconfigured, in-memory cache implicitly empty", flushedCount: 0, deletedCount: 0 };
  }

  try {
    const pattern = sourceId ? `source:${sourceId}:*` : "source:*";
    const deletedCount = await deleteMatchedRedisKeys(pattern);

    return {
      success: true,
      flushedCount: deletedCount,
      deletedCount: deletedCount,
      message: `Berhasil membersihkan ${deletedCount} cache key untuk ${sourceId || "semua source"}`,
    };
  } catch (error: any) {
    logger.error("Failed to flush source cache", { error });
    return {
      success: false,
      flushedCount: 0,
      deletedCount: 0,
      message: error?.message || "Gagal membersihkan cache Redis",
    };
  }
}
