import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { testCustomSourceParser } from "@/server/lib/sources/custom-source-service";
import { CustomSourceSchema } from "@/shared/sources/custom-source-schema";
import { logger } from "@/shared/logger";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = CustomSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Konfigurasi sumber tidak valid untuk diuji", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await testCustomSourceParser(parsed.data);
    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    logger.error("Gagal menguji parser custom source", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan saat menguji parser" },
      { status: 500 }
    );
  }
}
