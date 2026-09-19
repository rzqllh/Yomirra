import { probeAllSourcesHealth } from "@/server/lib/sources/health/probe";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { formatHealthDigest, sendTelegramMessage } from "./telegram-notifier";
import { AlertSeverity } from "./severity";
import { logger } from "@/shared/logger";

/**
 * Runs bounded lightweight functional probes across all enabled sources,
 * updates source health store, and delivers a compact Telegram digest.
 */
export async function sendHealthDigest(): Promise<boolean> {
  try {
    // 1. Run lightweight functional probe across all enabled sources
    const probedSnapshots = await probeAllSourcesHealth({ deep: false });

    // 2. Fallback to existing snapshots if probe returned empty
    let snapshots = probedSnapshots;
    if (Object.keys(snapshots).length === 0) {
      snapshots = await sourceHealthStore.getAllSnapshots();
    }

    if (Object.keys(snapshots).length === 0) {
      logger.warn("Health digest skipped: no sources probed or available in store.");
      return await sendTelegramMessage(
        "📊 *Yomirra Health*\n\n_No source health data currently available._",
        { severity: AlertSeverity.INFO }
      );
    }

    const message = formatHealthDigest(snapshots);

    return await sendTelegramMessage(message, {
      severity: AlertSeverity.INFO,
    });
  } catch (error: any) {
    logger.error("Failed to generate and send health digest", { error: error.message });
    return false;
  }
}
