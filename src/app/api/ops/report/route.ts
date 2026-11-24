import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { logger } from "@/shared/logger";
import { env } from "@/env";
import { formatUserReport } from "@/server/lib/ops/message-format";
import { enqueueUserReport } from "@/server/lib/ops/admin-report-service";
import { applyRateLimitHeaders, checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { z } from "zod";
import { verifyReportChallenge } from "@/server/lib/security/turnstile";
import { readBoundedJson } from "@/server/lib/security/bounded-json";

const schema=z.object({
  type:z.enum(["chapter_error","source_broken","image_broken","other"]),
  category:z.string().trim().min(1).max(100),
  detail:z.string().max(500).optional(),
  sourceId:z.string().max(64).optional(),
  mangaId:z.string().max(300).optional(),
  mangaTitle:z.string().max(500).optional(),
  chapterId:z.string().max(300).optional(),
  chapterTitle:z.string().max(500).optional(),
  pageIndex:z.number().int().min(0).max(100000).optional(),
  turnstileToken:z.string().min(1).max(2048).optional(),
});

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

  let raw:unknown;
  try { raw=await readBoundedJson(req,8192); }
  catch { return limitedJson({error:"Invalid report"}, {status:400}); }
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return limitedJson({error:"Invalid report"}, {status:400});
  const {turnstileToken,...sanitizedPayload}=parsed.data;
  const verification=await verifyReportChallenge(turnstileToken,env.NEXT_PUBLIC_APP_URL);
  if(verification!=="ok")return limitedJson({error:verification==="unavailable"?"Verification unavailable":"Verification required",
    code:"CHALLENGE_"+verification.toUpperCase()}, {status:verification==="unavailable"?503:403});

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
