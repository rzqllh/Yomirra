import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { flushSourceCache } from "@/server/lib/sources/admin-source-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : undefined;

    const result = await flushSourceCache(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Gagal membersihkan cache sumber", { error });
    return NextResponse.json({ error: "Gagal membersihkan cache sumber" }, { status: 500 });
  }
}
