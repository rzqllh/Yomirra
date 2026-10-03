import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { flushSourceCache, probeSource } from "@/server/lib/sources/admin-source-service";
import { updateReportStatus } from "@/server/lib/ops/admin-report-service";
import { recordAdminAudit } from "@/server/lib/admin/audit-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "report-action");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const { action, reportId, sourceId } = await req.json();

    if (action === "flush_source_cache" && sourceId) {
      const flushResult = await flushSourceCache(sourceId);
      if (reportId) await updateReportStatus(reportId, "investigating");
      return NextResponse.json({ action, ...flushResult });
    }

    if (action === "probe_source" && sourceId) {
      const probeResult = await probeSource(sourceId);
      return NextResponse.json({ action, ...probeResult });
    }

    if (action === "resolve" && reportId) {
      const updated = await updateReportStatus(reportId, "resolved");

      await recordAdminAudit({
        actor: { uid: auth.admin.uid, email: auth.admin.email },
        action: "report.resolve",
        targetType: "report",
        targetId: reportId,
        summary: `Menandai laporan '${reportId}' sebagai resolved`,
      }).catch(() => null);

      return NextResponse.json({ success: true, action, report: updated });
    }

    return NextResponse.json({ error: "Unsupported action or missing parameters" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
