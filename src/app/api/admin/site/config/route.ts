import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/server/lib/auth/admin-auth";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { getSiteConfig, updateSiteConfig } from "@/server/lib/site/site-config-service";
import { recordAdminAudit } from "@/server/lib/admin/audit-service";
import { logger } from "@/shared/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const config = await getSiteConfig();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    logger.error("Gagal mengambil konfigurasi situs untuk admin", { error });
    return NextResponse.json(
      { error: "Gagal mengambil konfigurasi situs" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const rateLimit = await checkRateLimitPolicy(req, "adminMutation", "site-config");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = await req.json();
    const updated = await updateSiteConfig(body);
    logger.info("Admin berhasil memperbarui konfigurasi situs", {
      admin: auth.admin?.email,
      updates: Object.keys(body),
    });

    await recordAdminAudit({
      actor: { uid: auth.admin.uid, email: auth.admin.email },
      action: "site.config.update",
      targetType: "site_config",
      summary: `Memperbarui konfigurasi situs: ${Object.keys(body).join(", ")}`,
      metadata: {
        keys: Object.keys(body),
        announcementEnabled: body.announcement?.enabled,
        maintenanceEnabled: body.maintenanceMode?.enabled,
        features: body.features,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error) {
    logger.error("Gagal memperbarui konfigurasi situs", { error });
    return NextResponse.json(
      { error: "Gagal memperbarui konfigurasi situs" },
      { status: 500 }
    );
  }
}
