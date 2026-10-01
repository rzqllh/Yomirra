import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { getStoredUserReports, updateReportStatus } from "@/server/lib/ops/admin-report-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";

    const reports = await getStoredUserReports(status, type);
    return NextResponse.json({ reports });
  } catch (error) {
    logger.error("Gagal mengambil laporan pengguna", { error });
    return NextResponse.json({ reports: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "report-status");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const { reportId, status } = await req.json();
    if (!reportId || !["pending", "investigating", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid reportId or status" }, { status: 400 });
    }

    const updated = await updateReportStatus(reportId, status);
    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    logger.error("Gagal memperbarui status laporan", { error });
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
