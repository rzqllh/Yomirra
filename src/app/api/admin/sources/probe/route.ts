import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { probeSource } from "@/server/lib/sources/admin-source-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { sourceId } = await req.json();
    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json({ error: "Parameter 'sourceId' wajib disertakan" }, { status: 400 });
    }

    const result = await probeSource(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Gagal melakukan live probe sumber", { error });
    return NextResponse.json({ error: "Gagal memproses live probe sumber" }, { status: 400 });
  }
}
