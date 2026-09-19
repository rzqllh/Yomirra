import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { AlertSeverity } from "./severity";
import { sendTelegramMessage } from "./telegram-notifier";
import { logger } from "@/shared/logger";

/**
 * Sends a daily technical operations digest with aggregate metrics.
 * Strictly avoids user-private telemetry (no reading progress, no queries, no user data).
 */
export async function sendDailyDigest(): Promise<boolean> {
  try {
    const allMetadata = getAllSourceMetadata().filter((s) => s.isEnabled && s.isInstalled);
    const totalSources = allMetadata.length;
    const knownSourceIds = allMetadata.map((s) => s.id);
    const snapshots = await sourceHealthStore.getAllSnapshots(knownSourceIds);

    let healthyCount = 0;
    let degradedCount = 0;
    let brokenCount = 0;
    let slowestSource = "None";
    let maxLatency = 0;
    let totalLatency = 0;
    let measuredCount = 0;

    for (const [id, snap] of Object.entries(snapshots)) {
      if (snap.status === "HEALTHY") {
        healthyCount++;
      } else if (snap.status === "DEGRADED") {
        degradedCount++;
      } else if (snap.status === "BROKEN") {
        brokenCount++;
      }

      if (snap.latencyMs > 0) {
        totalLatency += snap.latencyMs;
        measuredCount++;
        if (snap.latencyMs > maxLatency) {
          maxLatency = snap.latencyMs;
          slowestSource = id;
        }
      }
    }

    const avgLatency = measuredCount > 0 ? Math.round(totalLatency / measuredCount) : 0;
    const dateStr = new Date().toISOString().split("T")[0];

    let message = `📊 *Yomirra Daily Technical Digest*\n`;
    message += `*Date:* \`${dateStr}\`\n\n`;
    message += `*Sources Healthy:*   ${healthyCount} / ${totalSources}\n`;
    if (degradedCount > 0) message += `*Sources Degraded:*  ${degradedCount}\n`;
    if (brokenCount > 0) message += `*Sources Broken:*    ${brokenCount}\n`;
    message += `*Avg Latency:*       ${avgLatency}ms\n`;
    message += `*Slowest Source:*    \`${slowestSource}\` (${maxLatency}ms)\n`;

    return await sendTelegramMessage(message, {
      severity: AlertSeverity.INFO,
    });
  } catch (error: any) {
    logger.error("Failed to generate daily digest", { error: error.message });
    return false;
  }
}
