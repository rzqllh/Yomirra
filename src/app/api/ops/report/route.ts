import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import { env } from "@/env";

export const dynamic = "force-dynamic";

export type ReportType = "chapter_error" | "source_broken" | "image_broken" | "other";

interface ReportPayload {
  type: ReportType;
  category: string;
  detail?: string;
  sourceId?: string;
  mangaId?: string;
  chapterId?: string;
  chapterTitle?: string;
  pageIndex?: number;
}

function formatUserReport(payload: ReportPayload): string {
  let text = `🚩 *Laporan User*\n\n`;
  text += `*Kategori:* ${payload.category}\n`;

  if (payload.sourceId) text += `*Sumber:*   \`${payload.sourceId}\`\n`;
  if (payload.mangaId) text += `*Komik:*    \`${payload.mangaId}\`\n`;
  if (payload.chapterTitle || payload.chapterId) {
    const label = payload.chapterTitle || payload.chapterId;
    text += `*Bab:*      ${label}\n`;
  }
  if (typeof payload.pageIndex === "number") {
    text += `*Halaman:*  ${payload.pageIndex + 1}\n`;
  }

  if (payload.detail?.trim()) {
    text += `\n*Catatan:* ${payload.detail.trim()}`;
  }

  return text;
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    const origin = req.headers.get("origin");
    if (origin !== new URL(env.NEXT_PUBLIC_APP_URL).origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let payload: ReportPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.category || typeof payload.category !== "string") {
    return NextResponse.json({ error: "Missing category" }, { status: 400 });
  }

  // Sanitize inputs
  const category = payload.category.slice(0, 100);
  const detail = payload.detail?.slice(0, 500) ?? undefined;

  // Rate limit: 5 laporan per IP per 10 menit
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  if (redis) {
    try {
      const rlKey = `yomirra:report:rl:${ip}`;
      const count = await redis.incr(rlKey);
      if (count === 1) await redis.expire(rlKey, 600);
      if (count > 5) {
        logger.warn("User report rate limited", { ip });
        return NextResponse.json({ error: "Too many reports. Coba lagi dalam 10 menit." }, { status: 429 });
      }
    } catch {
      logger.warn("Redis unavailable for report rate limiting");
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
  }

  const sanitizedPayload: ReportPayload = {
    ...payload,
    category,
    detail,
  };

  const message = formatUserReport(sanitizedPayload);

  const delivered = await sendTelegramMessage(message, {
    severity: AlertSeverity.WARNING,
    fingerprint: undefined, // No dedup — setiap laporan user harus masuk
  });

  if (!delivered) {
    logger.warn("Failed to deliver user report to Telegram", { category });
    // Still return 200 — user tidak perlu tau internal failure
    return NextResponse.json({ success: true, delivered: false });
  }

  return NextResponse.json({ success: true, delivered: true });
}
