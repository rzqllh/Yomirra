import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { getRedisKeyDetail } from "@/server/lib/cache/admin-redis-service";
import { logger } from "@/shared/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Parameter 'key' wajib diisi" },
        { status: 400 }
      );
    }

    const detail = await getRedisKeyDetail(key);
    if (!detail) {
      return NextResponse.json(
        { error: `Key '${key}' tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      detail,
    });
  } catch (error) {
    logger.error("Gagal mengambil detail key Redis", { error });
    return NextResponse.json(
      { error: "Gagal mengambil detail key Redis" },
      { status: 500 }
    );
  }
}
