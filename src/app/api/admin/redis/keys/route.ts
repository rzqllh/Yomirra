import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { scanRedisKeys, deleteRedisKey } from "@/server/lib/cache/admin-redis-service";
import { logger } from "@/shared/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const pattern = searchParams.get("pattern") || "yomirra:*";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const keys = await scanRedisKeys(pattern, limit);
    return NextResponse.json({
      success: true,
      pattern,
      count: keys.length,
      keys,
    });
  } catch (error) {
    logger.error("Gagal scan Redis keys", { error });
    return NextResponse.json(
      { error: "Gagal mengambil daftar key Redis" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const key = body?.key;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Key harus berupa string yang valid" },
        { status: 400 }
      );
    }

    const success = await deleteRedisKey(key);
    return NextResponse.json({
      success,
      key,
      message: success ? `Key '${key}' berhasil dihapus` : `Key '${key}' tidak ditemukan atau gagal dihapus`,
    });
  } catch (error) {
    logger.error("Gagal menghapus key Redis", { error });
    return NextResponse.json(
      { error: "Gagal menghapus key Redis" },
      { status: 500 }
    );
  }
}
