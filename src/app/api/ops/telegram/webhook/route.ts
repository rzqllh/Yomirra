import { NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/shared/logger";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { redis, isRedisConfigured } from "@/server/lib/cache/redis";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import { getRuntimeSource, getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { probeSourceHealth } from "@/server/lib/sources/health/probe";
import { hasReaderPageEvidence } from "@/server/lib/sources/health/probe-coverage";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";
import { sendHealthDigest } from "@/server/lib/ops/health-digest";
import {
  failureGuidance,
  formatLatency,
  formatWibTime,
  sourceDisplayName,
  statusIcon,
} from "@/server/lib/ops/message-format";

export const dynamic = "force-dynamic";

const MAX_OPS_SNAPSHOT_AGE_MS = 12 * 60 * 60 * 1000;

function isFreshOpsSnapshot(
  snapshot: SourceHealthSnapshot | null | undefined,
  nowMs = Date.now()
): snapshot is SourceHealthSnapshot {
  if (!snapshot?.lastCheckedAt) return false;
  const checkedMs = Date.parse(snapshot.lastCheckedAt);
  return Number.isFinite(checkedMs) && checkedMs <= nowMs && nowMs - checkedMs <= MAX_OPS_SNAPSHOT_AGE_MS;
}

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
      case "/start":
      case "/help": {
        let message = "🤖 *Yomirra Ops Bot — Perintah Operasional*\n\n";
        message += "• `/status` — Ringkasan kesehatan semua source & performa\n";
        message += "• `/sources` — Daftar semua source aktif & status terkini\n";
        message += "• `/source <id>` — Detail kesehatan, rolling stats 24j, & latency\n";
        message += "• `/errors` — Daftar kendala atau issue aktif saat ini\n";
        message += "• `/recheck <id>` — Trigger deep probe langsung ke source tertentu\n";
        message += "• `/version` — Info lingkungan runtime, commit SHA, & Redis status\n";
        message += "• `/help` — Panduan daftar perintah ini";
        await sendTelegramMessage(message, { severity: AlertSeverity.INFO });
        break;
      }

      case "/status":
        await sendHealthDigest();
        break;

      case "/sources": {
        const runtimeSources = await getRuntimeSources();
        const active = runtimeSources.filter(isDiscoverySourceSystemEligible);
        const snapshots = await sourceHealthStore.getAllSnapshots(active.map((source) => source.id));
        const nowMs = Date.now();

        let message = `📚 *Yomirra · Sources*\n\n${active.length} source aktif\n\n`;
        for (const source of active) {
          const rawSnapshot = snapshots[source.id];
          const snapshot = isFreshOpsSnapshot(rawSnapshot, nowMs) ? rawSnapshot : undefined;
          const status = snapshot?.status || "UNKNOWN";
          const rolling = await sourceHealthStore.getRollingStats(source.id);

          message += `${statusIcon(status)} *${source.name}* (\`${source.id}\`) · ${status}`;
          if (snapshot?.latencyMs && Number.isFinite(snapshot.latencyMs) && snapshot.latencyMs > 0) {
            message += ` · ${formatLatency(snapshot.latencyMs)}`;
          }
          if (rolling.hasSufficientData && rolling.successRate !== "-") {
            message += ` · ${rolling.successRate} (24j)`;
          }
          message += "\n";
        }

        message += "\n_Gunakan \`/source <id>\` untuk detail atau \`/recheck <id>\` untuk probe._";
        await sendTelegramMessage(message.trim(), { severity: AlertSeverity.INFO });
        break;
      }

      case "/source": {
        const sourceId = args[1]?.toLowerCase();
        if (!sourceId) {
          await sendTelegramMessage("Gunakan: `/source <id>`\nContoh: `/source shinigami`", {
            severity: AlertSeverity.INFO,
          });
          break;
        }

        const meta = (await getRuntimeSource(sourceId)) ?? getSourceMetadata(sourceId);
        if (!meta) {
          await sendTelegramMessage(`Source \`${sourceId}\` tidak ditemukan di registry.`, {
            severity: AlertSeverity.WARNING,
          });
          break;
        }

        const rawSnapshot = await sourceHealthStore.getSnapshot(sourceId);
        const snapshot = isFreshOpsSnapshot(rawSnapshot) ? rawSnapshot : null;
        const rolling = await sourceHealthStore.getRollingStats(sourceId);
        const status = snapshot?.status || "UNKNOWN";

        let message = `🔎 *${meta.name}* (\`${meta.id}\`)\n\n`;
        message += `Status: ${statusIcon(status)} ${status}\n`;
        message += `Latency terkini: ${snapshot && snapshot.latencyMs ? formatLatency(snapshot.latencyMs) : "belum terukur"}\n`;
        if (rawSnapshot?.lastCheckedAt) {
          message += `Terakhir dicek: ${formatWibTime(rawSnapshot.lastCheckedAt)}${snapshot ? "" : " (kedaluwarsa >12j)"}\n`;
        }

        message += "\n*Statistik 24 Jam*\n";
        message += `• Success rate: ${rolling.successRate}\n`;
        message += `• p95 Latency: ${rolling.p95Latency}\n`;
        message += `• Sampel: ${rolling.totalSamples} probe${rolling.hasSufficientData ? "" : " (butuh ≥3 sampel)"}\n`;

        if (snapshot && snapshot.status !== "HEALTHY" && snapshot.status !== "UNKNOWN") {
          const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
          message += "\n*Masalah Terdeteksi*\n";
          message += `\`${snapshot.lastFailureCode || snapshot.status}\``;
          if (snapshot.stage) message += ` · stage \`${snapshot.stage}\``;
          message += `\n${guidance.cause}\n\n*Tindakan*\n${guidance.action}\n`;
        } else if (status === "UNKNOWN") {
          message += "\n_Source ini belum memiliki probe segar dalam 12 jam terakhir._\n";
        }

        message += `\nPerintah recheck: \`/recheck ${meta.id}\``;
        await sendTelegramMessage(message.trim(), { severity: AlertSeverity.INFO });
        break;
      }

      case "/errors": {
        const runtimeSources = await getRuntimeSources();
        const sourceIds = runtimeSources
          .filter(isDiscoverySourceSystemEligible)
          .map((source) => source.id);
        const snapshots = await sourceHealthStore.getAllSnapshots(sourceIds);
        const nowMs = Date.now();
        const activeErrors: Array<[string, SourceHealthSnapshot]> = [];
        const unmeasured: string[] = [];
        for (const sourceId of sourceIds) {
          const snap = snapshots[sourceId];
          if (!isFreshOpsSnapshot(snap, nowMs) || snap.status === "UNKNOWN" || !snap.status) {
            unmeasured.push(sourceId);
          } else if (snap.status !== "HEALTHY") {
            activeErrors.push([sourceId, snap]);
          }
        }

        if (activeErrors.length === 0) {
          let text = "🟢 *Tidak ada error aktif*\n\nSemua source yang terukur berjalan normal.";
          if (unmeasured.length > 0) {
            text += `\n\n_${unmeasured.length} source belum diperiksa. Ketik /status atau /recheck <id> untuk menguji._`;
          }
          await sendTelegramMessage(text, { severity: AlertSeverity.INFO });
          break;
        }

        let message = `⚠️ *Error aktif · ${activeErrors.length}*\n\n`;
        for (const [sourceId, snapshot] of activeErrors) {
          const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
          message += `${statusIcon(snapshot.status)} *${sourceDisplayName(sourceId)}* (\`${sourceId}\`)\n`;
          message += `${snapshot.stage || "source"} · \`${snapshot.lastFailureCode || snapshot.status}\`\n`;
          message += `→ ${guidance.action}\n`;
          message += `Langkah: \`/recheck ${sourceId}\`\n\n`;
        }

        await sendTelegramMessage(message.trim(), { severity: AlertSeverity.WARNING });
        break;
      }

      case "/recheck": {
        const sourceId = args[1]?.toLowerCase();
        if (!sourceId) {
          await sendTelegramMessage("Gunakan: `/recheck <id>`\nContoh: `/recheck shinigami`", {
            severity: AlertSeverity.INFO,
          });
          break;
        }

        const meta = (await getRuntimeSource(sourceId)) ?? getSourceMetadata(sourceId);
        if (!meta) {
          await sendTelegramMessage(`Source \`${sourceId}\` tidak ditemukan di registry.`, {
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
              `Recheck *${meta.name}* terlalu sering. Tunggu sekitar 1 menit sebelum mencoba lagi.`,
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
            const stageSummary = hasReaderPageEvidence(snapshot)
              ? "deep probe (listing + detail + chapter + referensi halaman)"
              : snapshot.metadata?.pagesSkipped
                ? `deep probe hingga stage \`${snapshot.stage || "chapters"}\` (halaman dilewati: \`${snapshot.metadata.pagesSkipped}\`)`
                : `deep probe hingga stage \`${snapshot.stage || "search"}\``;
            let reply = `🟢 *${meta.name} normal*\n\n`;
            reply += `• Stage diuji: ${stageSummary}\n`;
            reply += "• Cakupan: referensi halaman terverifikasi; decode gambar di perangkat pengguna tidak diuji server\n";
            reply += `• Latency: ${formatLatency(snapshot.latencyMs)}\n`;
            if (snapshot.resolvedHost) reply += `• Host: \`${snapshot.resolvedHost}\`\n`;
            reply += "\nTidak ada tindakan lanjutan yang diperlukan.";
            await sendTelegramMessage(reply, { severity: AlertSeverity.INFO });
          } else {
            const guidance = failureGuidance(snapshot.lastFailureCode, snapshot.stage);
            let reply = `${statusIcon(snapshot.status)} *${meta.name} masih bermasalah*\n\n`;
            reply += `• Status: \`${snapshot.status}\`\n`;
            reply += `• Code: \`${snapshot.lastFailureCode || "UNKNOWN_ERROR"}\`\n`;
            if (snapshot.stage) reply += `• Stage: \`${snapshot.stage}\`\n`;
            reply += `• Latency: ${formatLatency(snapshot.latencyMs)}\n`;
            reply += `\n*Penyebab*\n${guidance.cause}\n\n*Tindakan*\n${guidance.action}`;
            await sendTelegramMessage(reply, { severity: AlertSeverity.WARNING });
          }
        } catch (error: any) {
          await sendTelegramMessage(
            `🔴 *Recheck ${meta.name} gagal dieksekusi*\n\n${error.message || "Probe tidak bisa dijalankan."}`,
            { severity: AlertSeverity.CRITICAL }
          );
        }
        break;
      }

      case "/version": {
        const runtimeSources = await getRuntimeSources();
        const activeSources = runtimeSources.filter(isDiscoverySourceSystemEligible).length;
        const totalSources = runtimeSources.length;
        const commitHash =
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
          "local";
        const envName = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

        let message = `⚙️ *Yomirra · Ops & Sistem*\n\n`;
        message += `• Environment: \`${envName}\`\n`;
        message += `• Commit: \`${commitHash.substring(0, 7)}\`\n`;
        message += `• Source aktif: ${activeSources} / ${totalSources}\n`;
        message += `• Cache/Redis: ${isRedisConfigured ? "✅ Terhubung (Upstash)" : "⚠️ In-Memory Fallback"}\n`;
        message += `• App URL: ${env.NEXT_PUBLIC_APP_URL || "https://www.yomirra.web.id"}`;

        await sendTelegramMessage(message, { severity: AlertSeverity.INFO });
        break;
      }

      default:
        await sendTelegramMessage(
          `Perintah \`${command}\` tidak dikenali.\nKetik \`/help\` untuk melihat daftar perintah.`,
          { severity: AlertSeverity.INFO }
        );
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Telegram webhook error", { error: error.message });
    return NextResponse.json({ success: true });
  }
}
