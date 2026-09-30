import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { sendDailyDigest } from "@/server/lib/ops/daily-digest";
import { logger } from "@/shared/logger";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const success = await sendDailyDigest();
    return NextResponse.json({
      success,
      message: success
        ? "Daily digest berhasil dipicu dan dikirim ke Telegram"
        : "Pengiriman daily digest selesai tanpa bot Telegram aktif",
    });
  } catch (error) {
    logger.error("Gagal memicu daily digest manual", { error });
    return NextResponse.json(
      { error: "Gagal memicu pengiriman daily digest" },
      { status: 500 }
    );
  }
}
