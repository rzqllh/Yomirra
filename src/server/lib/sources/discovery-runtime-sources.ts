import { sourceHealthStore } from "./health/health-store";
import { getFriendlyErrorMessage } from "./error";
import { getRuntimeSources } from "./runtime-sources";
import type { SourceHealthSnapshot } from "./health/types";
import type { SourceMetadata } from "@/shared/sources/source-types";

let pendingSnapshots: Promise<Record<string, SourceHealthSnapshot>> | undefined;
let nextSnapshotRead = 0;

export function applyDiscoveryMaintenance(
  source: SourceMetadata,
  snapshot?: SourceHealthSnapshot
): SourceMetadata {
  if (snapshot && ["HEALTHY", "DEGRADED"].includes(snapshot.status)) {
    if (!source.maintenance || snapshot.lastCheckedAt >= source.maintenance.since) {
      return { ...source, maintenance: undefined };
    }
  }

  if (snapshot && ["BROKEN", "DOMAIN_CHANGED", "RATE_LIMITED"].includes(snapshot.status)
      && snapshot.consecutiveFailures >= 2
      && (!source.maintenance || snapshot.lastCheckedAt >= source.maintenance.since)) {
    return {
      ...source,
      maintenance: {
        reason: getFriendlyErrorMessage(snapshot.lastFailureCode ?? "UNKNOWN"),
        since: snapshot.lastCheckedAt,
      },
    };
  }

  return source;
}

export async function getDiscoveryRuntimeSources(): Promise<SourceMetadata[]> {
  const sources = await getRuntimeSources();
  if (!pendingSnapshots || Date.now() >= nextSnapshotRead) {
    nextSnapshotRead = Date.now() + 30_000;
    pendingSnapshots = sourceHealthStore.getAllSnapshots(sources.map(({ id }) => id));
  }
  const snapshots = await pendingSnapshots;
  return sources.map((source) => applyDiscoveryMaintenance(source, snapshots[source.id]));
}
