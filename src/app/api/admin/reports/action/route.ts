import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { readBoundedJson } from "@/server/lib/security/bounded-json";
import { flushSourceCache, probeSource } from "@/server/lib/sources/admin-source-service";
import { updateReportStatus } from "@/server/lib/ops/admin-report-service";
import { recordAdminAudit } from "@/server/lib/admin/audit-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("flush_source_cache"),
    sourceId: z.string().trim().min(1).max(64),
    reportId: z.string().trim().min(1).max(128).optional(),
  }),
  z.object({
    action: z.literal("probe_source"),
    sourceId: z.string().trim().min(1).max(64),
    reportId: z.string().trim().min(1).max(128).optional(),
  }),
  z.object({
    action: z.literal("resolve"),
    reportId: z.string().trim().min(1).max(128),
  }),
]);

export async function POST(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "report-action");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  let raw: unknown;
  try {
    raw = await readBoundedJson(req, 1024);
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unsupported action or missing parameters" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "flush_source_cache") {
      const flushResult = await flushSourceCache(parsed.data.sourceId);
      if (parsed.data.reportId) {
        await updateReportStatus(parsed.data.reportId, "investigating");
      }
      return NextResponse.json({ action: parsed.data.action, ...flushResult });
    }

    if (parsed.data.action === "probe_source") {
      const probeResult = await probeSource(parsed.data.sourceId);
      return NextResponse.json({ action: parsed.data.action, ...probeResult });
    }

    const updated = await updateReportStatus(parsed.data.reportId, "resolved");
    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await recordAdminAudit({
      actor: { uid: auth.admin.uid, email: auth.admin.email },
      action: "report.resolve",
      targetType: "report",
      targetId: parsed.data.reportId,
      summary: `Menandai laporan '${parsed.data.reportId}' sebagai resolved`,
    }).catch(() => null);

    return NextResponse.json({ success: true, action: parsed.data.action, report: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "REPORT_STORAGE_UNAVAILABLE") {
      logger.error("Penyimpanan laporan admin tidak tersedia saat menjalankan aksi");
      return NextResponse.json({ error: "Report storage unavailable" }, { status: 503 });
    }
    logger.error("Gagal menjalankan aksi laporan admin", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Action execution failed" }, { status: 500 });
  }
}
