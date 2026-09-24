import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { env } from "@/env";

export const dynamic = "force-dynamic";

/**
 * Legacy compatibility wrapper for observability alert POST requests.
 * Eliminates duplicate Telegram fetch implementations by delegating to the unified ops notifier.
 */
export async function POST(req: Request) {
  const secret = env.OPS_CRON_SECRET || env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sourceId, oldStatus, newStatus, message } = body;

    if (!sourceId || !newStatus) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const severity =
      newStatus === "BROKEN" || newStatus === "DEGRADED" || newStatus === "down"
        ? AlertSeverity.CRITICAL
        : newStatus === "HEALTHY" || newStatus === "ok"
        ? AlertSeverity.RECOVERY
        : AlertSeverity.WARNING;

    const text = `*Source:* \`${sourceId}\`\n*Status:* \`${oldStatus || "unknown"}\` ➡️ \`${newStatus}\`${message ? `\n*Details:* ${message}` : ""}`;

    const delivered = await sendTelegramMessage(text, {
      severity,
      sourceId,
      fingerprint: `obs:${sourceId}`,
    });

    return NextResponse.json({ success: true, delivered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
