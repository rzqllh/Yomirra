import { NextResponse } from "next/server";
import { env } from "@/env";
import { sendHealthDigest } from "@/server/lib/ops/health-digest";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expectedSecret = env.OPS_CRON_SECRET || env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    logger.warn("Unauthorized attempt to trigger ops health digest cron");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const success = await sendHealthDigest();

  if (success) {
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } else {
    return NextResponse.json({ error: "Failed to send digest or unconfigured" }, { status: 500 });
  }
}
