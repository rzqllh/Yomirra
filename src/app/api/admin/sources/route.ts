import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { 
  getSourceHealthMatrix, 
  saveCoreSourceOverride,
  type CoreSourceOverride 
} from "@/server/lib/sources/admin-source-service";
import { recordAdminAudit } from "@/server/lib/admin/audit-service";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const matrix = await getSourceHealthMatrix();
    return NextResponse.json({ sources: matrix });
  } catch (error) {
    logger.error("Gagal mengambil matriks status sumber", { error });
    return NextResponse.json(
      { error: "Gagal memuat status sumber data" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "source-config");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = (await req.json()) as {
      sourceId: string;
      isEnabled?: boolean;
      activeDomain?: string;
      mirrors?: string[];
      rateLimit?: number;
    };

    if (!body.sourceId) {
      return NextResponse.json(
        { error: "sourceId wajib disertakan" },
        { status: 400 }
      );
    }

    const saved = await saveCoreSourceOverride(body.sourceId, {
      isEnabled: body.isEnabled,
      activeDomain: body.activeDomain,
      mirrors: body.mirrors,
      rateLimit: body.rateLimit,
    });

    logger.info("Core source override berhasil disimpan ke Redis", { saved });

    await recordAdminAudit({
      actor: { uid: auth.admin.uid, email: auth.admin.email },
      action: "source.override.update",
      targetType: "source",
      targetId: body.sourceId,
      summary: `Memperbarui konfigurasi runtime untuk '${body.sourceId}'`,
      metadata: {
        isEnabled: body.isEnabled,
        activeDomain: body.activeDomain,
        mirrors: body.mirrors,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      override: saved,
      message: `Konfigurasi dinamis untuk '${body.sourceId}' berhasil diperbarui`,
    });
  } catch (error) {
    logger.error("Gagal menyimpan override core source", { error });
    return NextResponse.json(
      { error: "Gagal memperbarui konfigurasi sumber" },
      { status: 500 }
    );
  }
}
