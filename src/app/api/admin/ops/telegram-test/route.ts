import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { logger } from "@/shared/logger";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const operator = auth.admin?.email || auth.admin?.uid || "Admin Operator";
    const text = `🔔 *Yomirra Admin Alert Test*\n\nUji coba notifikasi bot Telegram berhasil dipicu dari Admin Portal.\nOperator: \`${operator}\`\nWaktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;

    const sent = await sendTelegramMessage(text, {
      severity: AlertSeverity.INFO,
      fingerprint: `admin-test-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      delivered: sent,
      message: sent
        ? "Notifikasi Telegram berhasil dikirim"
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
