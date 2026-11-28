import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { getStoredUserReports, updateReportStatus } from "@/server/lib/ops/admin-report-service";
import { logger } from "@/shared/logger";
import {readBoundedJson} from "@/server/lib/security/bounded-json";
import {z} from "zod";
const statusSchema=z.object({reportId:z.string().min(1).max(128),status:z.enum(["pending","investigating","resolved"])});

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
    return NextResponse.json({ reports },{headers:{"Cache-Control":"private, no-store"}});
  } catch {
    logger.error("Gagal mengambil laporan pengguna");
    return NextResponse.json({error:"Report storage unavailable"},{status:503,headers:{"Cache-Control":"private, no-store"}});
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

  let raw:unknown;
  try{raw=await readBoundedJson(req,1024);}catch{return NextResponse.json({error:"Invalid request payload"},{status:400});}
  const parsed=statusSchema.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"Invalid reportId or status"},{status:400});
  try {
    const updated = await updateReportStatus(parsed.data.reportId, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch {
    logger.error("Gagal memperbarui status laporan");
    return NextResponse.json({error:"Report storage unavailable"},{status:503});
  }
}
