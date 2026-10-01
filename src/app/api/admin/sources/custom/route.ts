import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { 
  getCustomSources, 
  saveCustomSource, 
  deleteCustomSource 
} from "@/server/lib/sources/custom-source-service";
import { CustomSourceSchema } from "@/shared/sources/custom-source-schema";
import { logger } from "@/shared/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const sources = await getCustomSources();
    return NextResponse.json({
      success: true,
      count: sources.length,
      sources,
    });
  } catch (error) {
    logger.error("Gagal mengambil custom sources", { error });
    return NextResponse.json(
      { error: "Gagal mengambil daftar custom source" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "custom-source-write");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = await req.json();
    const parsed = CustomSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data konfigurasi sumber tidak valid", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const saved = await saveCustomSource(parsed.data);
    logger.info("Custom source berhasil disimpan", { id: saved.id, name: saved.name });

    return NextResponse.json({
      success: true,
      source: saved,
      message: `Source '${saved.name}' berhasil disimpan dan aktif`,
    });
  } catch (error) {
    logger.error("Gagal menyimpan custom source", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan konfigurasi sumber" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "custom-source-delete");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parameter 'id' sumber wajib diisi" },
        { status: 400 }
      );
    }

    const success = await deleteCustomSource(id);
    return NextResponse.json({
      success,
      id,
      message: success ? `Source '${id}' berhasil dihapus` : `Source '${id}' gagal dihapus`,
    });
  } catch (error) {
    logger.error("Gagal menghapus custom source", { error });
    return NextResponse.json(
      { error: "Gagal memproses penghapusan sumber" },
      { status: 500 }
    );
  }
}
