import { probeAllSourcesHealth } from "@/server/lib/sources/health/probe";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";
import { formatHealthDigest, sendTelegramMessage } from "./telegram-notifier";
import { formatWibTime } from "./message-format";
import { AlertSeverity } from "./severity";
import { logger } from "@/shared/logger";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";

// Only fresh results from this run count as completed probes. A missing result
// must never be replaced by a potentially stale stored snapshot.
export function formatHealthDigestWithCoverage(
  activeSourceIds: string[],
  probedSnapshots: Record<string, SourceHealthSnapshot>,
  timestamp: Date = new Date()
): string {
  const ids = [...new Set(activeSourceIds.map((id) => id.toLowerCase().trim()).filter(Boolean))];
  if (!ids.length) {
    return `📊 *Yomirra · Health*\n${formatWibTime(timestamp)}\n\nBelum ada source aktif yang terdaftar.`;
  }

  const completed: Record<string, SourceHealthSnapshot> = Object.create(null);
  for (const id of ids) {
    const snapshot = probedSnapshots[id];
    const checkedAt = Date.parse(snapshot?.lastCheckedAt ?? "");
    const now = timestamp.getTime();
    if (snapshot?.sourceId === id && Number.isFinite(checkedAt) && checkedAt <= now && now-checkedAt <= 5*60*1000) completed[id] = snapshot;
  }

  const measured = Object.keys(completed).length;
  const unmeasured = ids.length - measured;

  if (!measured) {
    return `📊 *Yomirra · Health*\n${formatWibTime(timestamp)}\n\n0 dari ${ids.length} source berhasil diperiksa\n${unmeasured} belum terukur (probe gagal atau timeout). Status belum dapat dipastikan.`;
  }

  const message = formatHealthDigest(completed, timestamp, ids.length);
  return unmeasured
    ? `${message}\n\n${unmeasured} dari ${ids.length} source belum terukur (probe gagal atau timeout).`
    : message;
}

/**
 * Runs bounded lightweight functional probes across installed sources,
 * then sends a digest that includes incomplete-probe coverage.
 */
export async function sendHealthDigest(): Promise<boolean> {
  try {
    const probedSnapshots = await probeAllSourcesHealth({ deep: false });
    const runtimeSources = await getRuntimeSources();
    const activeIds = runtimeSources
      .filter(isDiscoverySourceSystemEligible)
      .map((source) => source.id);

    const message = formatHealthDigestWithCoverage(activeIds, probedSnapshots);
    return await sendTelegramMessage(message, { severity: AlertSeverity.INFO });
  } catch (error: unknown) {
    logger.error("Failed to generate and send health digest", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
