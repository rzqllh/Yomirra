import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { flushSourceCache, probeSource } from "@/server/lib/sources/admin-source-service";
import { updateReportStatus } from "@/server/lib/ops/admin-report-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
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
      return NextResponse.json({ success: true, action, report: updated });
    }

    return NextResponse.json({ error: "Unsupported action or missing parameters" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
