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
import {
  failureGuidance,
  formatLatency,
  formatWibTime,
  sourceDisplayName,
  statusIcon,
} from "@/server/lib/ops/message-format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (!env.TELEGRAM_WEBHOOK_SECRET || secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn("Unauthorized webhook attempt: invalid or missing secret token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.message?.text) {
      return NextResponse.json({ success: true });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text.trim();

    if (!env.TELEGRAM_ALLOWED_CHAT_IDS) {
      logger.warn("Unauthorized webhook attempt: TELEGRAM_ALLOWED_CHAT_IDS is not configured");
      return NextResponse.json({ success: true });
    }

    const allowed = env.TELEGRAM_ALLOWED_CHAT_IDS.split(",").map((value) => value.trim());
    if (!allowed.includes(chatId)) {
      logger.warn(`Unauthorized webhook attempt from chat ID: ${chatId}`);
      return NextResponse.json({ success: true });
    }

    if (!text.startsWith("/")) {
      return NextResponse.json({ success: true });
    }

    try {
      const rateLimitKey = `yomirra:ops:rl:telegram:${chatId}`;
      const currentCount = await redis.incr(rateLimitKey);
      if (currentCount === 1) await redis.expire(rateLimitKey, 60);
      if (currentCount > 10) {
        return NextResponse.json({ success: true });
      }
    } catch {
      // Commands remain available if Redis is temporarily unavailable.
    }

    const args = text.split(/\s+/);
    const command = args[0].toLowerCase();

    switch (command) {
      case "/status":
        await sendHealthDigest();
        break;

      case "/sources": {
        const active = sourceRegistry.filter((source) => source.isEnabled && source.isInstalled);
        const snapshots = await sourceHealthStore.getAllSnapshots(active.map((source) => source.id));

        let message = `📚 *Yomirra · Sources*\n\n${active.length} source aktif\n\n`;
        for (const source of active) {
          const snapshot = snapshots[source.id];
          const status = snapshot?.status || (source.status === "online" ? "HEALTHY" : "UNKNOWN");
          message += `${statusIcon(status)} *${source.name}* · ${status}`;
          if (snapshot?.latencyMs) message += ` · ${formatLatency(snapshot.latencyMs)}`;
          message += "\n";
        }

        await sendTelegramMessage(message.trim(), { severity: AlertSeverity.INFO });
        break;
      }

      case "/source": {
        const sourceId = args[1]?.toLowerCase();
        if (!sourceId) {
          await sendTelegramMessage("Gunakan: `/source <id>`", { severity: AlertSeverity.INFO });
          break;
        }

        const meta = getSourceMetadata(sourceId);
        if (!meta) {
          await sendTelegramMessage(`Source \`${sourceId}\` tidak ditemukan.`, {
            severity: AlertSeverity.WARNING,
          });
          break;
        }

        const snapshot = await sourceHealthStore.getSnapshot(sourceId);
        const status = snapshot?.status || (meta.status === "online" ? "HEALTHY" : "UNKNOWN");

        let message = `🔎 *${meta.name}*\n\n`;
        message += `Status: ${status}\n`;
        message += `Latency: ${snapshot ? formatLatency(snapshot.latencyMs) : "belum terukur"}\n`;
        if (snapshot?.lastCheckedAt) {
          message += `Terakhir dicek: ${formatWibTime(snapshot.lastCheckedAt)}\n`;
        }

        if (snapshot && snapshot.status !== "HEALTHY") {
          const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
          message += "\n*Masalah*\n";
          message += `\`${snapshot.lastFailureCode || snapshot.status}\``;
          if (snapshot.stage) message += ` · ${snapshot.stage}`;
          message += `\n${guidance.cause}\n\n*Tindakan*\n${guidance.action}\n`;
        }

        message += `\nID: \`${meta.id}\``;
        await sendTelegramMessage(message, { severity: AlertSeverity.INFO });
        break;
      }

      case "/errors": {
        const sourceIds = sourceRegistry
          .filter((source) => source.isEnabled && source.isInstalled)
          .map((source) => source.id);
        const snapshots = await sourceHealthStore.getAllSnapshots(sourceIds);
        const activeErrors = Object.entries(snapshots).filter(([, snap]) => snap.status !== "HEALTHY");

        if (activeErrors.length === 0) {
          await sendTelegramMessage(
            "🟢 *Tidak ada error aktif*\n\nSemua source yang terukur normal.",
            { severity: AlertSeverity.INFO }
          );
          break;
        }

        let message = `⚠️ *Error aktif · ${activeErrors.length}*\n\n`;
        for (const [sourceId, snapshot] of activeErrors) {
          const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
          message += `${statusIcon(snapshot.status)} *${sourceDisplayName(sourceId)}*\n`;
          message += `${snapshot.stage || "source"} · \`${snapshot.lastFailureCode || snapshot.status}\`\n`;
          message += `→ ${guidance.action}\n\n`;
        }

        await sendTelegramMessage(message.trim(), { severity: AlertSeverity.WARNING });
        break;
      }

      case "/recheck": {
        const sourceId = args[1]?.toLowerCase();
        if (!sourceId) {
          await sendTelegramMessage("Gunakan: `/recheck <id>`", { severity: AlertSeverity.INFO });
          break;
        }

        const meta = getSourceMetadata(sourceId);
        if (!meta) {
          await sendTelegramMessage(`Source \`${sourceId}\` tidak ditemukan.`, {
            severity: AlertSeverity.WARNING,
          });
          break;
        }

        try {
          const recheckLimitKey = `yomirra:ops:rl:recheck:${sourceId}`;
          const count = await redis.incr(recheckLimitKey);
          if (count === 1) await redis.expire(recheckLimitKey, 60);
          if (count > 2) {
            await sendTelegramMessage(
              `Recheck ${meta.name} terlalu sering. Coba lagi sekitar 1 menit.`,
              { severity: AlertSeverity.WARNING }
            );
            break;
          }
        } catch {
          // A probe is still useful when Redis is unavailable.
        }

        await sendTelegramMessage(`Mengecek ulang *${meta.name}*…`, {
          severity: AlertSeverity.INFO,
        });

        try {
          const snapshot = await probeSourceHealth(sourceId, { deep: true });

          if (snapshot.status === "HEALTHY") {
            await sendTelegramMessage(
              `🟢 *${meta.name} normal*\n\nDeep probe berhasil.\nLatency: ${formatLatency(snapshot.latencyMs)}\n\nTidak ada tindakan lanjutan.`,
              { severity: AlertSeverity.INFO }
            );
          } else {
            const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
            let message = `${statusIcon(snapshot.status)} *${meta.name} masih bermasalah*\n\n`;
            message += `Code: \`${snapshot.lastFailureCode || snapshot.status}\``;
            if (snapshot.stage) message += ` · Stage: \`${snapshot.stage}\``;
            message += `\n\n*Tindakan*\n${guidance.action}`;
            await sendTelegramMessage(message, { severity: AlertSeverity.WARNING });
          }
        } catch (error: any) {
          await sendTelegramMessage(
            `🔴 *Recheck ${meta.name} gagal*\n\n${error.message || "Probe tidak bisa dijalankan."}`,
            { severity: AlertSeverity.CRITICAL }
          );
        }
        break;
      }

      case "/version":
        await sendTelegramMessage(
          `⚙️ *Yomirra · Ops*\n\nEnvironment: ${process.env.NODE_ENV || "development"}\nSource aktif: ${sourceRegistry.filter((source) => source.isEnabled && source.isInstalled).length}`,
          { severity: AlertSeverity.INFO }
        );
        break;

      default:
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Telegram webhook error", { error: error.message });
    return NextResponse.json({ success: true });
  }
}
