import { NextResponse } from "next/server";
import { env } from "@/env";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { logger } from "@/shared/logger";
import { redis } from "@/server/lib/cache/redis";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!env.VERCEL_DEPLOY_SECRET || authHeader !== `Bearer ${env.VERCEL_DEPLOY_SECRET}`) {
    logger.warn("Unauthorized attempt to trigger deploy notify");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const commitHash = body.commit || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
    const environment = process.env.NODE_ENV || "production";
    const url = env.NEXT_PUBLIC_APP_URL;

    // Check Redis connection as part of smoke test
    let redisStatus = "✅ OK";
    try {
      await redis.ping();
    } catch {
      redisStatus = "❌ DOWN";
    }

    const activeSources = sourceRegistry.filter(s => s.isEnabled).length;
    const totalSources = sourceRegistry.length;

    const message = `🚀 *Deployment Successful*\n\n` +
      `*Environment:* \`${environment}\`\n` +
      `*Commit:* \`${commitHash.substring(0, 7)}\`\n` +
      `*URL:* [Yomirra](${url})\n\n` +
      `*Smoke Test:*\n` +
      `Redis: ${redisStatus}\n` +
      `Active Sources: ${activeSources} / ${totalSources}`;

    await sendTelegramMessage(message, {
      severity: AlertSeverity.INFO,
      event: "DEPLOYMENT_SUCCESS"
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Deploy notify error", { error: error.message });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
