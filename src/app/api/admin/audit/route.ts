import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { getAdminAuditLog } from "@/server/lib/admin/audit-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "audit-log");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const auditLog = await getAdminAuditLog(limit);

    return NextResponse.json({
      success: true,
      auditLog,
    });
  } catch (error) {
    logger.error("Gagal mengambil log audit admin", { error });
    return NextResponse.json(
      { error: "Gagal memuat log audit" },
      { status: 500 }
    );
  }
}
