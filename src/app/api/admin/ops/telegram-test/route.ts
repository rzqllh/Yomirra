import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { getSourceHealthMatrix } from "@/server/lib/sources/admin-source-service";
import { formatLatency, formatWibDate, statusIcon } from "@/server/lib/ops/message-format";
import { logger } from "@/shared/logger";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "telegram-test");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const operator = auth.admin?.email || auth.admin?.uid || "Admin Operator";
    const now = new Date();

    // Pull live health data for informative summary
    let matrix: Awaited<ReturnType<typeof getSourceHealthMatrix>> = [];
    try {
      matrix = await getSourceHealthMatrix();
    } catch {
      // Fallback: send without health data
    }

    const enabled = matrix.filter((s) => s.isEnabled);
    const healthy = enabled.filter((s) => s.status === "HEALTHY");
    const degraded = enabled.filter((s) => s.status === "DEGRADED");
    const down = enabled.filter((s) => s.status === "DOWN");
    const unmeasured = enabled.filter((s) => s.status === "UNMEASURED");

    const latencies = enabled
      .map((s) => s.latencyMs)
      .filter((l) => l > 0)
      .sort((a, b) => a - b);

    const medianLatency =
      latencies.length === 0
        ? 0
        : latencies.length % 2
          ? latencies[Math.floor(latencies.length / 2)]
          : Math.round(
              (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2
            );

    const slowest = [...enabled]
      .filter((s) => s.latencyMs > 0)
      .sort((a, b) => b.latencyMs - a.latencyMs)[0];

    let text = `🔔 *Yomirra Admin — Test Notifikasi*\n`;
    text += `${formatWibDate(now)}, dipicu oleh \`${operator}\`\n\n`;

    if (enabled.length > 0) {
      text += `*Status Source (${enabled.length} aktif)*\n`;
      text += `${statusIcon("HEALTHY")} Sehat: ${healthy.length}\n`;
      if (degraded.length) text += `${statusIcon("DEGRADED")} Degraded: ${degraded.length}\n`;
      if (down.length) text += `${statusIcon("DOWN")} Down: ${down.length}\n`;
      if (unmeasured.length) text += `⚪ Belum terukur: ${unmeasured.length}\n`;

      if (degraded.length || down.length) {
        const problematic = [...degraded, ...down].slice(0, 5);
        text += `\n*Bermasalah*\n`;
        for (const s of problematic) {
          text += `${statusIcon(s.status)} ${s.name}\n`;
        }
        if (degraded.length + down.length > 5) {
          text += `... dan ${degraded.length + down.length - 5} lainnya\n`;
        }
      }

      text += `\n*Performa*\n`;
      text += medianLatency
        ? `Median latency: ${formatLatency(medianLatency)}\n`
        : `Median latency: belum ada data\n`;
      if (slowest) {
        text += `Paling lambat: ${slowest.name} — ${formatLatency(slowest.latencyMs)}\n`;
      }
    } else {
      text += `_Belum ada data source tersedia._\n`;
    }

    text += `\n_Notifikasi bot Telegram berfungsi normal._`;

    const sent = await sendTelegramMessage(text, {
      severity: AlertSeverity.INFO,
      fingerprint: `admin-test-${Date.now()}`,
      isManualTest: true,
    });

    return NextResponse.json({
      success: true,
      delivered: sent,
      message: sent
        ? "Notifikasi Telegram berhasil dikirim dengan ringkasan health"
        : "Bot Telegram belum dikonfigurasi (bot token/chat ID kosong)",
    });
  } catch (error) {
    logger.error("Gagal mengirim test notifikasi Telegram", { error });
    return NextResponse.json(
      { error: "Gagal memproses pengiriman notifikasi Telegram" },
      { status: 500 }
    );
  }
}
