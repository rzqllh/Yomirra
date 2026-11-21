import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";
import { AlertSeverity } from "./severity";
import { sendTelegramMessage } from "./telegram-notifier";
import { logger } from "@/shared/logger";
import {
  failureGuidance,
  formatLatency,
  formatWibDate,
  sourceDisplayName,
  statusIcon,
} from "./message-format";

// Health probes are scheduled every six hours. Older observations are unknown,
// not evidence of either source availability or an ongoing incident.
const MAX_SNAPSHOT_AGE_MS = 12 * 60 * 60 * 1000;

export function formatDailyDigest(
  sourceIds: string[],
  snapshots: Record<string, SourceHealthSnapshot>,
  timestamp: Date = new Date()
): string {
  const ids = [...new Set(sourceIds.map((id) => id.toLowerCase().trim()).filter(Boolean))];
  const now = timestamp.getTime();
  const freshEntries: Array<[string, SourceHealthSnapshot]> = [];
  let expiredCount = 0;

  for (const id of ids) {
    const snapshot = snapshots[id];
    if (!snapshot) continue;

    const checkedAt = Date.parse(snapshot.lastCheckedAt);
    if (
      !Number.isFinite(checkedAt) ||
      checkedAt > now ||
      now - checkedAt > MAX_SNAPSHOT_AGE_MS
    ) {
      expiredCount++;
      continue;
    }
    if (!snapshot.status || snapshot.status === "UNKNOWN") continue;
    freshEntries.push([id, snapshot]);
  }

  const healthy = freshEntries.filter(([, snapshot]) => snapshot.status === "HEALTHY");
  const unhealthy = freshEntries.filter(([, snapshot]) => snapshot.status !== "HEALTHY");
  const unmeasuredCount = ids.length - freshEntries.length;

  const latencies = freshEntries
    .map(([, snapshot]) => snapshot.latencyMs)
    .filter((latency) => Number.isFinite(latency) && latency > 0)
    .sort((a, b) => a - b);

  const medianLatency =
    latencies.length === 0
      ? 0
      : latencies.length % 2
        ? latencies[Math.floor(latencies.length / 2)]
        : Math.round(
            (latencies[latencies.length / 2 - 1] +
              latencies[latencies.length / 2]) /
              2
          );

  const slowest = freshEntries
    .filter(([, snapshot]) => Number.isFinite(snapshot.latencyMs) && snapshot.latencyMs > 0)
    .sort((a, b) => b[1].latencyMs - a[1].latencyMs)[0];

  let message = `📋 *Yomirra · Ringkasan Harian*\n${formatWibDate(timestamp)}\n\n`;
  message += "*Stabilitas*\n";
  message += `${healthy.length} dari ${ids.length} source normal\n`;

  if (unhealthy.length) {
    message += `${unhealthy.length} perlu perhatian\n`;
  } else if (unmeasuredCount) {
    message += "Status keseluruhan belum dapat dipastikan\n";
  } else if (ids.length === 0) {
    message += "Belum ada source aktif yang terdaftar\n";
  } else {
    message += "Tidak ada gangguan aktif pada pemeriksaan terbaru\n";
  }

  if (unmeasuredCount) message += `${unmeasuredCount} belum terukur atau belum diperbarui\n`;
  if (expiredCount) message += `${expiredCount} snapshot kedaluwarsa (>12 jam)\n`;

  if (unhealthy.length) {
    message += "\n*Perlu perhatian*\n";
    for (const [sourceId, snapshot] of unhealthy) {
      const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
      message += `${statusIcon(snapshot.status)} ${sourceDisplayName(sourceId)} · ${snapshot.stage || "source"} · \`${snapshot.lastFailureCode || snapshot.status}\`\n`;
      message += `→ ${guidance.action}\n`;
    }
  }

  message += "\n*Performa*\n";
  message += medianLatency
    ? `Median ${formatLatency(medianLatency)}\n`
    : "Belum ada latency terbaru yang terukur\n";
  if (slowest) {
    message += `Paling lambat: ${sourceDisplayName(slowest[0])} · ${formatLatency(slowest[1].latencyMs)}\n`;
  }

  message += "\n*Tindakan terbuka*\n";
  message += unhealthy.length
    ? `${unhealthy.length} source perlu dicek`
    : unmeasuredCount
      ? `${unmeasuredCount} source perlu probe terbaru.`
      : ids.length
        ? "Tidak ada."
        : "Periksa konfigurasi source aktif.";

  return message;
}

export async function sendDailyDigest(): Promise<boolean> {
  try {
    // Use the same runtime source registry as the six-hour Health Digest.
    // It includes core overrides and installed custom sources.
    const activeSources = (await getRuntimeSources()).filter(
      (source) => source.isEnabled && source.isInstalled
    );
    const sourceIds = activeSources.map((source) => source.id);
    const snapshots = await sourceHealthStore.getAllSnapshots(sourceIds);
    const message = formatDailyDigest(sourceIds, snapshots);

    return await sendTelegramMessage(message, {
      severity: AlertSeverity.INFO,
    });
  } catch (error: unknown) {
    logger.error("Failed to generate daily digest", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
