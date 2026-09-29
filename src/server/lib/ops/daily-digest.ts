import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
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

export async function sendDailyDigest(): Promise<boolean> {
  try {
    const activeSources = getAllSourceMetadata().filter(
      (source) => source.isEnabled && source.isInstalled
    );
    const snapshots = await sourceHealthStore.getAllSnapshots(
      activeSources.map((source) => source.id)
    );
    const entries = Object.entries(snapshots);
    const unhealthy = entries.filter(([, snapshot]) => snapshot.status !== "HEALTHY");
    const unmeasuredCount = Math.max(0, activeSources.length - entries.length);

    const latencies = entries
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

    const slowest = entries
      .filter(([, snapshot]) => snapshot.latencyMs > 0)
      .sort((a, b) => b[1].latencyMs - a[1].latencyMs)[0];

    let message = `📋 *Yomirra · Ringkasan Harian*\n${formatWibDate(new Date())}\n\n`;
    message += "*Stabilitas*\n";
    message += `${entries.length - unhealthy.length} dari ${activeSources.length} source normal\n`;
    message += unhealthy.length
      ? `${unhealthy.length} perlu perhatian\n`
      : "Tidak ada gangguan aktif\n";
    if (unmeasuredCount) message += `${unmeasuredCount} belum terukur\n`;

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
      : "Belum ada latency yang terukur\n";
    if (slowest) {
      message += `Paling lambat: ${sourceDisplayName(slowest[0])} · ${formatLatency(slowest[1].latencyMs)}\n`;
    }

    message += "\n*Tindakan terbuka*\n";
    message += unhealthy.length
      ? `${unhealthy.length} source perlu dicek`
      : "Tidak ada.";

    return await sendTelegramMessage(message, {
      severity: AlertSeverity.INFO,
    });
  } catch (error: any) {
    logger.error("Failed to generate daily digest", { error: error.message });
    return false;
  }
}
