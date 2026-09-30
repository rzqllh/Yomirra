import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { getStoredUserReports, updateReportStatus } from "@/server/lib/ops/admin-report-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";

  const reports = await getStoredUserReports(status, type);
  return NextResponse.json({ reports });
}

export async function PATCH(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
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
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
