import { env } from "@/env";
import { logger } from "@/shared/logger";
import { AlertSeverity } from "./severity";
import { getAlertState, saveAlertState } from "./alert-state";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";
import {
  failureGuidance,
  formatLatency,
  formatWibTime,
  impactForStage,
  sourceDisplayName,
  statusIcon,
} from "./message-format";

export interface TelegramMessageOptions {
  severity: AlertSeverity;
  sourceId?: string;
  event?: string;
  stage?: string;
  fingerprint?: string;
}

const FAST_ESCALATION_EVENTS = new Set([
  "ROUTE_CHANGED",
  "PARSER_BROKEN",
  "DECRYPT_FAILURE",
  "DOMAIN_CHANGED",
]);

export function formatHealthDigest(
  snapshots: Record<string, SourceHealthSnapshot>,
  timestamp = new Date()
): string {
  const entries = Object.entries(snapshots);
  const unhealthy = entries.filter(([, snapshot]) => snapshot.status !== "HEALTHY");
  const measuredLatencies = entries
    .map(([, snapshot]) => snapshot.latencyMs)
    .filter((latency) => Number.isFinite(latency) && latency > 0);
  const averageLatency = measuredLatencies.length
    ? Math.round(
        measuredLatencies.reduce((sum, latency) => sum + latency, 0) /
          measuredLatencies.length
      )
    : 0;
  const slow = entries
    .filter(([, snapshot]) => snapshot.status === "HEALTHY" && snapshot.latencyMs >= 1500)
    .sort((a, b) => b[1].latencyMs - a[1].latencyMs)
    .slice(0, 2);
  const healthyCount = entries.length - unhealthy.length;

  let text = `📊 *Yomirra · Health*\n${formatWibTime(timestamp)}\n\n`;
  text += `${entries.length} source diperiksa\n`;
  text += unhealthy.length
    ? `${healthyCount} normal · ${unhealthy.length} perlu perhatian\n`
    : `${healthyCount}/${entries.length} source normal\n`;

  if (unhealthy.length) {
    text += "\n*Perlu perhatian*\n";
    for (const [sourceId, snapshot] of unhealthy) {
      const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
      text += `${statusIcon(snapshot.status)} *${sourceDisplayName(sourceId)}*\n`;
      text += `${snapshot.stage || "source"} · \`${snapshot.lastFailureCode || snapshot.status}\` · ${formatLatency(snapshot.latencyMs)}\n`;
      text += `→ ${guidance.action}\n\n`;
    }
  }

  if (slow.length) {
    text += "*Lambat*\n";
    for (const [sourceId, snapshot] of slow) {
      text += `🟠 ${sourceDisplayName(sourceId)} · ${formatLatency(snapshot.latencyMs)}\n`;
    }
    text += "\n";
  }

  if (!unhealthy.length && !slow.length) {
    if (averageLatency) text += `Rata-rata ${formatLatency(averageLatency)}\n`;
    text += "Tidak ada tindakan.";
  }

  return text.trim();
}

export function formatCriticalAlert(snapshot: SourceHealthSnapshot): string {
  const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
  let text = `${statusIcon(snapshot.status)} *${sourceDisplayName(snapshot.sourceId)} bermasalah*\n\n`;

  text += `*Dampak*\n${impactForStage(snapshot.stage)}\n\n`;
  text += `*Kemungkinan penyebab*\n${guidance.cause}\n\n`;
  text += `*Tindakan*\n${guidance.action}\n\n`;
  text += "*Status*\n";
  text += `${snapshot.consecutiveFailures} kegagalan berturut-turut\n`;
  if (snapshot.lastSuccessAt) {
    text += `Terakhir normal: ${formatWibTime(snapshot.lastSuccessAt)}\n`;
  }
  text += `Code: \`${snapshot.lastFailureCode || snapshot.status}\``;
  if (snapshot.stage) text += ` · Stage: \`${snapshot.stage}\``;
  if (snapshot.resolvedHost) text += `\nHost: \`${snapshot.resolvedHost}\``;
  text += `\n\n/recheck ${snapshot.sourceId}`;

  return text;
}

export function formatRecoveryAlert(
  snapshot: SourceHealthSnapshot,
  downtime?: string
): string {
  let text = `🟢 *${sourceDisplayName(snapshot.sourceId)} pulih*\n\n`;
  text += "Source kembali normal.\n";
  if (downtime) text += `Gangguan berlangsung ${downtime}.\n`;
  text += `Latency sekarang ${formatLatency(snapshot.latencyMs)}.\n\n`;
  text += "Tidak ada tindakan lanjutan.";
  return text;
}

export async function sendTelegramMessage(
  text: string,
  options: TelegramMessageOptions
): Promise<boolean> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    logger.warn("Telegram bot token or chat ID not configured. Skipping alert.", {
      severity: options.severity,
      fingerprint: options.fingerprint,
    });
    return false;
  }

  const now = new Date();

  if (options.fingerprint) {
    if (
      options.severity === AlertSeverity.CRITICAL ||
      options.severity === AlertSeverity.WARNING
    ) {
      let state = await getAlertState(options.fingerprint);

      if (!state) {
        state = {
          fingerprint: options.fingerprint,
          firstSeen: now.toISOString(),
          lastSeen: now.toISOString(),
          consecutiveFailures: 1,
          alertedAt: null,
          recoveredAt: null,
          cooldownUntil: null,
        };
      } else {
        state.lastSeen = now.toISOString();
        state.consecutiveFailures += 1;
      }

      const threshold =
        options.event && FAST_ESCALATION_EVENTS.has(options.event) ? 1 : 3;

      if (state.consecutiveFailures < threshold) {
        await saveAlertState(state);
        logger.info(
          `Suppressing alert for ${options.fingerprint} (failure ${state.consecutiveFailures}/${threshold})`
        );
        return false;
      }

      if (state.cooldownUntil && new Date(state.cooldownUntil) > now) {
        await saveAlertState(state);
        logger.info(
          `Suppressing alert for ${options.fingerprint} (in cooldown until ${state.cooldownUntil})`
        );
        return false;
      }

      state.alertedAt = now.toISOString();
      state.cooldownUntil = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      await saveAlertState(state);
    } else if (options.severity === AlertSeverity.RECOVERY) {
      const state = await getAlertState(options.fingerprint);
      if (!state || !state.alertedAt) {
        if (state) {
          state.recoveredAt = now.toISOString();
          state.consecutiveFailures = 0;
          state.cooldownUntil = null;
          await saveAlertState(state);
        }
        return false;
      }
    }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Failed to send Telegram alert", { error: errorText });

      if (errorText.includes("can't parse entities")) {
        const fallbackResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text,
            }),
          }
        );

        if (fallbackResponse.ok) {
          logger.info("Successfully delivered Telegram alert via plain-text fallback");
          return true;
        }
      }

      return false;
    }

    if (options.fingerprint && options.severity === AlertSeverity.RECOVERY) {
      const state = await getAlertState(options.fingerprint);
      if (state) {
        state.alertedAt = null;
        state.recoveredAt = now.toISOString();
        state.consecutiveFailures = 0;
        state.cooldownUntil = null;
        await saveAlertState(state);
      }
    }

    return true;
  } catch (error: any) {
    logger.error("Telegram notifier error", { error: error.message });
    return false;
  }
}
