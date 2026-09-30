import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { simulateSearchRanking } from "@/server/lib/search/admin-search-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Parameter 'query' wajib diisi" }, { status: 400 });
    }

    const simulation = await simulateSearchRanking(query);
    return NextResponse.json(simulation);
  } catch (error) {
    logger.error("Gagal melakukan simulasi ranking pencarian", { error });
    return NextResponse.json({ error: "Gagal memproses simulasi pencarian" }, { status: 400 });
  }
}
