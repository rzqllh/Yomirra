import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { probeSource, getSourceHealthMatrix } from "@/server/lib/sources/admin-source-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminExpensive", "source-probe");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { sourceId } = body;

    // Single source probe
    if (sourceId && typeof sourceId === "string") {
      const result = await probeSource(sourceId);
      return NextResponse.json({ probe: result, results: [result] });
    }

    // Probe all active sources
    const matrix = await getSourceHealthMatrix();
    const active = matrix.filter((s) => s.isEnabled && s.isInstalled);

    const results = await Promise.allSettled(
      active.map((s) => probeSource(s.id))
    );

    const probeResults = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { sourceId: "unknown", success: false, latencyMs: 0, message: "Probe gagal" }
    );

    const successCount = probeResults.filter((r) => r.success).length;

    return NextResponse.json({
      results: probeResults,
      summary: {
        total: probeResults.length,
        success: successCount,
        failed: probeResults.length - successCount,
      },
    });
  } catch (error) {
    logger.error("Gagal melakukan live probe sumber", { error });
    return NextResponse.json({ error: "Gagal memproses live probe sumber" }, { status: 500 });
  }
}
