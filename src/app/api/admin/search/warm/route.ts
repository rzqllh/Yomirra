import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { warmSearchCatalog } from "@/server/lib/search/admin-search-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const result = await warmSearchCatalog();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("Gagal melakukan pemanasan katalog pencarian", { error });
    return NextResponse.json(
      { error: "Gagal memanaskan katalog pencarian" },
      { status: 500 }
    );
  }
}
