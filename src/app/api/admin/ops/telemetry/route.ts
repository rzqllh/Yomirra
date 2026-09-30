import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { getRedisTelemetry } from "@/server/lib/cache/admin-redis-service";
import { logger } from "@/shared/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const telemetry = await getRedisTelemetry();
    return NextResponse.json({
      success: true,
      telemetry,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Gagal mengambil telemetri admin", { error });
    return NextResponse.json(
      { error: "Gagal mengambil data telemetri sistem" },
      { status: 500 }
    );
  }
}
