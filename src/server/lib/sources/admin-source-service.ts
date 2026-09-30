import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import * as domainResolverModule from "@/server/lib/sources/domain-resolver";
import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import { sourceManager } from "@/server/lib/sources/source-manager";
import type { SourceHealthStatus } from "@/server/lib/sources/health/types";

export interface SourceHealthMatrixItem {
  id: string;
  name: string;
  isEnabled: boolean;
  isInstalled: boolean;
  status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNMEASURED";
  healthStatus: SourceHealthStatus;
  consecutiveFailures: number;
  latencyMs: number;
  lastCheckedAt?: string;
  mirrors: string[];
  activeDomain: string;
  upstreamDomain: string;
}

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

export async function getCoreSourceOverrides(): Promise<Record<string, CoreSourceOverride>> {
  if (!redis) return {};
  try {
    const raw = await redis.get(CORE_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveCoreSourceOverride(
  sourceId: string,
  override: Partial<CoreSourceOverride>
): Promise<CoreSourceOverride> {
  const normId = sourceId.toLowerCase().trim();
  const current = await getCoreSourceOverrides();
  const existing = current[normId] || { id: normId };

  const updated: CoreSourceOverride = {
    ...existing,
    ...override,
    id: normId,
    updatedAt: new Date().toISOString(),
  };

  current[normId] = updated;

  if (redis) {
    await redis.set(CORE_OVERRIDES_KEY, JSON.stringify(current));
    // If activeDomain is changed, sync directly to DomainResolver cache in Redis
    if (updated.activeDomain) {
      const cleanHost = updated.activeDomain.replace(/\/+$/, "");
      await redis.set(
        `yomirra:domain:${normId}:frontend`,
        JSON.stringify({
          sourceId: normId,
          role: "frontend",
          currentHost: cleanHost,
          verifiedAt: new Date().toISOString(),
          status: "verified",
        }),
        "EX",
        86400 * 30
      );
    }
  }

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

      let mirrors: string[] = override?.mirrors || [];
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
  if (!redis) {
    return { success: true, message: "Redis unconfigured, in-memory cache implicitly empty", flushedCount: 0, deletedCount: 0 };
  }

  try {
    const pattern = sourceId ? `source:${sourceId}:*` : "source:*";
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return {
      success: true,
      flushedCount: keys.length,
      deletedCount: keys.length,
      message: `Berhasil membersihkan ${keys.length} cache key untuk ${sourceId || "semua source"}`,
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
