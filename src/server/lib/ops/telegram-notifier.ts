import { env } from "@/env";
import { logger } from "@/shared/logger";
import { AlertSeverity, SEVERITY_EMOJIS } from "./severity";
import { getAlertState, saveAlertState } from "./alert-state";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";

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

/**
 * Formats a compact 6-hour health digest.
 */
export function formatHealthDigest(
  snapshots: Record<string, SourceHealthSnapshot>,
  timestamp = new Date()
): string {
  // Format WIB (UTC+7)
  const wibHours = (timestamp.getUTCHours() + 7) % 24;
  const minutes = timestamp.getUTCMinutes().toString().padStart(2, "0");
  const timeStr = `${wibHours.toString().padStart(2, "0")}:${minutes} WIB`;

  let text = `📊 *Yomirra Health — ${timeStr}*\n\n`;

  for (const [sourceId, snap] of Object.entries(snapshots)) {
    const isHealthy = snap.status === "HEALTHY";
    const latency = snap.latencyMs >= 1000 
      ? `${(snap.latencyMs / 1000).toFixed(1)}s` 
      : `${snap.latencyMs}ms`;

    if (isHealthy) {
      text += `\`${sourceId.padEnd(12, " ")}\` ✅ HEALTHY   ${latency}\n`;
    } else {
      const code = snap.lastFailureCode || snap.status;
      text += `\`${sourceId.padEnd(12, " ")}\` ❌ ${snap.status}    ${code} (${latency})\n`;
    }
  }

  return text;
}

/**
 * Formats a critical alert for a broken/degraded source.
 */
export function formatCriticalAlert(snap: SourceHealthSnapshot): string {
  let text = `🚨 *Yomirra Source Alert*\n\n`;
  text += `*Source:*      \`${snap.sourceId}\`\n`;
  text += `*Status:*      \`${snap.status}\`\n`;
  if (snap.lastFailureCode) text += `*Code:*        \`${snap.lastFailureCode}\`\n`;
  if (snap.stage) text += `*Stage:*       \`${snap.stage}\`\n`;
  text += `*Failures:*    ${snap.consecutiveFailures}\n`;
  if (snap.lastSuccessAt) text += `*Last success:* \`${snap.lastSuccessAt}\`\n`;
  if (snap.resolvedHost) text += `*Resolved host:* \`${snap.resolvedHost}\`\n`;
  if (snap.errorMessage) text += `*Detail:*      ${snap.errorMessage}\n`;
  return text;
}

/**
 * Formats a recovery alert when a source transitions back to healthy.
 */
export function formatRecoveryAlert(snap: SourceHealthSnapshot, downtime?: string): string {
  let text = `✅ *${snap.sourceId} recovered*\n\n`;
  text += `*Transition:*  DEGRADED/BROKEN → HEALTHY\n`;
  if (downtime) text += `*Downtime:*    ${downtime}\n`;
  if (snap.resolvedHost) text += `*Host:*        \`${snap.resolvedHost}\`\n`;
  text += `*Latency:*     ${snap.latencyMs}ms\n`;
  return text;
}

/**
 * Sends a message to the configured Telegram chat.
 * Implements deduplication if a fingerprint is provided.
 */
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

  // Deduplication & threshold logic
  if (options.fingerprint) {
    if (options.severity === AlertSeverity.CRITICAL || options.severity === AlertSeverity.WARNING) {
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

      // Fast-path escalation: deterministic errors alert on 1st failure; transient on 3rd
      const isFastEscalation = options.event && FAST_ESCALATION_EVENTS.has(options.event);
      const threshold = isFastEscalation ? 1 : 3;

      if (state.consecutiveFailures < threshold) {
        await saveAlertState(state);
        logger.info(
          `Suppressing alert for ${options.fingerprint} (failure ${state.consecutiveFailures}/${threshold})`
        );
        return false;
      }

      // Check cooldown if already alerted
      if (state.cooldownUntil && new Date(state.cooldownUntil) > now) {
        await saveAlertState(state);
        logger.info(`Suppressing alert for ${options.fingerprint} (in cooldown until ${state.cooldownUntil})`);
        return false;
      }

      // Commit alert state: 30-minute cooldown
      state.alertedAt = now.toISOString();
      state.cooldownUntil = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      await saveAlertState(state);
    } else if (options.severity === AlertSeverity.RECOVERY) {
      // Send recovery only if we previously alerted on this fingerprint
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

  // Prepend emoji header if text doesn't already contain emoji
  const emoji = SEVERITY_EMOJIS[options.severity] || "";
  let formattedText = text;
  if (!text.includes(emoji) && options.severity !== AlertSeverity.INFO) {
    formattedText = `${emoji} *${options.severity}*\n\n${text}`;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedText,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error("Failed to send Telegram alert", { error: errorText });
      return false;
    }

    // Reset alert state upon successful recovery delivery
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
