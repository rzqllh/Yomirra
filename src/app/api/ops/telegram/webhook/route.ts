import { NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/shared/logger";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { redis } from "@/server/lib/cache/redis";
import { sourceRegistry, getSourceMetadata } from "@/shared/sources/source-registry";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { probeSourceHealth } from "@/server/lib/sources/health/probe";
import { sendHealthDigest } from "@/server/lib/ops/health-digest";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (!env.TELEGRAM_WEBHOOK_SECRET || secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn("Unauthorized webhook attempt: invalid or missing secret token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Telegram sends various update types; we only process text messages
    if (!body?.message?.text) {
      return NextResponse.json({ success: true });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text.trim();

    if (!env.TELEGRAM_ALLOWED_CHAT_IDS) {
      logger.warn("Unauthorized webhook attempt: TELEGRAM_ALLOWED_CHAT_IDS is not configured");
      return NextResponse.json({ success: true });
    }

    const allowed = env.TELEGRAM_ALLOWED_CHAT_IDS.split(",").map((s) => s.trim());
    if (!allowed.includes(chatId)) {
      logger.warn(`Unauthorized webhook attempt from chat ID: ${chatId}`);
      return NextResponse.json({ success: true }); // Return 200 so Telegram stops retrying
    }

    // Only process slash commands
    if (!text.startsWith("/")) {
      return NextResponse.json({ success: true });
    }

    if (redis) {
      try {
        const rateLimitKey = `yomirra:ops:rl:telegram:${chatId}`;
        const currentCount = await redis.incr(rateLimitKey);
        if (currentCount === 1) {
          await redis.expire(rateLimitKey, 60);
        }
        if (currentCount > 10) {
          return NextResponse.json({ success: true });
        }
      } catch {
        // Fallback if Redis is unavailable: allow execution
      }
    }

    const args = text.split(/\s+/);
    const command = args[0].toLowerCase();

    switch (command) {
      case "/status":
        await sendHealthDigest();
        break;

      case "/sources": {
        const activeCount = sourceRegistry.filter((s) => s.isEnabled).length;
        const listText =
          `📚 *Yomirra Sources (${activeCount})*\n\n` +
          sourceRegistry
            .map((s) => {
              const status = s.isEnabled ? (s.status === "online" ? "✅" : "⚠️") : "❌";
              return `${status} \`${s.id.padEnd(12, " ")}\` - ${s.name}`;
            })
            .join("\n");
        await sendTelegramMessage(listText, { severity: AlertSeverity.INFO });
        break;
      }

      case "/source": {
        const sourceId = args[1]?.toLowerCase();
        if (!sourceId) {
          await sendTelegramMessage("Usage: `/source <id>`", { severity: AlertSeverity.INFO });
          break;
        }

        const meta = getSourceMetadata(sourceId);
        if (!meta) {
          await sendTelegramMessage(`Source \`${sourceId}\` not found in registry.`, {
            severity: AlertSeverity.WARNING,
          });
          break;
        }

        const snapshot = await sourceHealthStore.getSnapshot(sourceId);

        let detailText = `🔍 *Source Detail: ${meta.name}*\n\n`;
        detailText += `*ID:*           \`${meta.id}\`\n`;
        detailText += `*Status:*       ${meta.isEnabled ? "Enabled" : "Disabled"}\n`;
        detailText += `*Language:*     ${meta.language || "all"}\n`;
        detailText += `*Health:*       ${snapshot?.status || "UNKNOWN"}\n`;
        detailText += `*Latency:*      ${snapshot?.latencyMs !== undefined ? `${snapshot.latencyMs}ms` : "-"}\n`;
        detailText += `*Resolved Host:* \`${snapshot?.resolvedHost || meta.baseUrl || "-"}\`\n`;
        detailText += `*Failures:*     ${snapshot?.consecutiveFailures ?? 0}\n`;
        if (snapshot?.lastFailureCode) {
          detailText += `*Last Error:*   \`${snapshot.lastFailureCode}\`\n`;
        }
        if (snapshot?.lastCheckedAt) {
          detailText += `*Last Checked:* \`${snapshot.lastCheckedAt}\`\n`;
        }

        await sendTelegramMessage(detailText, { severity: AlertSeverity.INFO });
        break;
      }

      case "/errors": {
        const knownSourceIds = sourceRegistry.filter((s) => s.isEnabled).map((s) => s.id);
        const snapshots = await sourceHealthStore.getAllSnapshots(knownSourceIds);
        const activeErrors = Object.entries(snapshots).filter(
          ([_, snap]) => snap.status !== "HEALTHY"
        );

        if (activeErrors.length === 0) {
          await sendTelegramMessage(
            "✅ *No Active Source Errors*\n\nAll measured sources are HEALTHY.",
            { severity: AlertSeverity.INFO }
          );
        } else {
          let errorText = `⚠️ *Active Source Errors (${activeErrors.length})*\n\n`;
          for (const [id, snap] of activeErrors) {
            errorText += `❌ \`${id}\`: *${snap.status}*\n`;
            if (snap.lastFailureCode) errorText += `   Code: \`${snap.lastFailureCode}\`\n`;
            if (snap.stage) errorText += `   Stage: \`${snap.stage}\`\n`;
            if (snap.consecutiveFailures) errorText += `   Failures: ${snap.consecutiveFailures}\n`;
            if (snap.errorMessage) errorText += `   Detail: ${snap.errorMessage.slice(0, 60)}\n`;
            errorText += "\n";
          }
          await sendTelegramMessage(errorText, { severity: AlertSeverity.WARNING });
        }
        break;
      }

      case "/recheck": {
        const targetId = args[1]?.toLowerCase();
        if (!targetId) {
          await sendTelegramMessage("Usage: `/recheck <id>`", { severity: AlertSeverity.INFO });
          break;
        }

        const meta = getSourceMetadata(targetId);
        if (!meta) {
          await sendTelegramMessage(`Source \`${targetId}\` not recognized in registry.`, {
            severity: AlertSeverity.WARNING,
          });
          break;
        }

        // Rate limit recheck specifically (max 2 per 60s per target)
        if (redis) {
          try {
            const recheckLimitKey = `yomirra:ops:rl:recheck:${targetId}`;
            const rcCount = await redis.incr(recheckLimitKey);
            if (rcCount === 1) await redis.expire(recheckLimitKey, 60);
            if (rcCount > 2) {
              await sendTelegramMessage(
                `Too many rechecks for \`${targetId}\`. Please wait 1 minute.`,
                { severity: AlertSeverity.WARNING }
              );
              break;
            }
          } catch {
            // allow probe if redis fails
          }
        }

        await sendTelegramMessage(`Initiating deep functional probe for \`${targetId}\`...`, {
          severity: AlertSeverity.INFO,
        });

        try {
          const snapshot = await probeSourceHealth(targetId, { deep: true });

          if (snapshot.status === "HEALTHY") {
            await sendTelegramMessage(
              `✅ *Probe Successful*\n\n*Source:* \`${targetId}\`\n*Status:* HEALTHY\n*Latency:* ${snapshot.latencyMs}ms\n*Host:* \`${snapshot.resolvedHost}\``,
              { severity: AlertSeverity.RECOVERY }
            );
          } else {
            await sendTelegramMessage(
              `❌ *Probe Failed*\n\n*Source:* \`${targetId}\`\n*Status:* ${snapshot.status}\n*Code:* \`${snapshot.lastFailureCode || "UNKNOWN"}\`\n*Stage:* \`${snapshot.stage}\`\n*Error:* ${snapshot.errorMessage || "Unknown failure"}`,
              { severity: AlertSeverity.CRITICAL }
            );
          }
        } catch (err: any) {
          await sendTelegramMessage(
            `❌ *Probe Error*\n\n*Source:* \`${targetId}\`\n*Error:* ${err.message || "Execution exception"}`,
            { severity: AlertSeverity.CRITICAL }
          );
        }
        break;
      }

      case "/version":
        await sendTelegramMessage(
          `⚙️ *Yomirra Ops Runtime*\n\n*Version:* 1.0.0 (Phase 4 + Ops V1)\n*Environment:* ${process.env.NODE_ENV || "development"}\n*Active Sources:* ${sourceRegistry.filter((s) => s.isEnabled).length}`,
          { severity: AlertSeverity.INFO }
        );
        break;

      default:
        // Ignore unknown or unhandled commands
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Telegram webhook error", { error: error.message });
    return NextResponse.json({ success: true });
  }
}
