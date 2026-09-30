import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { domainResolver, SOURCE_DOMAINS } from "@/server/lib/sources/domain-resolver";
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
  healthStatus?: SourceHealthStatus;
  consecutiveFailures?: number;
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

export async function getSourceHealthMatrix(): Promise<SourceHealthMatrixItem[]> {
  const sources = getAllSourceMetadata();
  const snapshots = await sourceHealthStore.getAllSnapshots(sources.map((s) => s.id));

  return Promise.all(
    sources.map(async (meta) => {
      const snapshot = snapshots[meta.id];
      const activeDomain = await domainResolver.resolveDomain(meta.id).catch(() => meta.baseUrl || "");
      const config = SOURCE_DOMAINS[meta.id.toLowerCase()];
      const mirrors = config?.frontend?.mirrors || [];

      let status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNMEASURED" = "UNMEASURED";
      if (snapshot) {
        if (snapshot.status === "HEALTHY") status = "HEALTHY";
        else if (snapshot.status === "DEGRADED") status = "DEGRADED";
        else status = "DOWN";
      } else if (meta.status === "online") {
        status = "HEALTHY";
      }

      return {
        id: meta.id,
        name: meta.name,
        isEnabled: meta.isEnabled,
        isInstalled: meta.isInstalled,
        status,
        healthStatus: snapshot?.status || "HEALTHY",
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
    const pattern = sourceId ? `yomirra:*:${sourceId}:*` : "yomirra:source:*";
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
