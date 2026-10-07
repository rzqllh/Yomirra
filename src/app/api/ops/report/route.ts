import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { logger } from "@/shared/logger";
import { env } from "@/env";
import { formatUserReport } from "@/server/lib/ops/message-format";
import { enqueueUserReport } from "@/server/lib/ops/admin-report-service";
import { applyRateLimitHeaders, checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import type { UserReportPayload } from "@/shared/types/report";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    const origin = req.headers.get("origin");
    if (origin !== new URL(env.NEXT_PUBLIC_APP_URL).origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rateLimit = await checkRateLimitPolicy(req, "userReport");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit, {
      unavailableMessage: "Service temporarily unavailable",
      tooManyMessage: "Too many reports. Coba lagi dalam 10 menit.",
    });
  }

  const limitedJson = (body: unknown, init?: ResponseInit) =>
    applyRateLimitHeaders(NextResponse.json(body, init), rateLimit);

  let payload: UserReportPayload;

  try {
    payload = await req.json();
  } catch {
    return limitedJson({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.category || typeof payload.category !== "string") {
    return limitedJson({ error: "Missing category" }, { status: 400 });
  }

  // Sanitize inputs
  const category = payload.category.slice(0, 100);
  const detail = payload.detail?.slice(0, 500) ?? undefined;

  const sanitizedPayload: UserReportPayload = {
    ...payload,
    category,
    detail,
  };

  // Enqueue report for Admin Dashboard Inbox
  await enqueueUserReport(sanitizedPayload);

  const message = formatUserReport(sanitizedPayload);

  const delivered = await sendTelegramMessage(message, {
    severity: AlertSeverity.WARNING,
    fingerprint: undefined, // No dedup — setiap laporan user harus masuk
  });

  if (!delivered) {
    logger.warn("Failed to deliver user report to Telegram", { category });
    // Still return 200 — user tidak perlu tau internal failure
    return limitedJson({ success: true, delivered: false });
  }

  return limitedJson({ success: true, delivered: true });
}
