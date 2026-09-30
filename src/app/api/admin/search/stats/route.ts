import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { getSearchIntelligenceStats } from "@/server/lib/search/admin-search-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const stats = await getSearchIntelligenceStats();
    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Gagal mengambil statistik pencarian", { error });
    return NextResponse.json({
      totalCachedQueries: 0,
      totalCatalogTitles: 0,
      lastWarmedAt: null,
      topSampledQueries: [],
      embeddingsStatus: "standby",
    });
  }
}
