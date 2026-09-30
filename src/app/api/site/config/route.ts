import { NextResponse } from "next/server";
import { getSiteConfig } from "@/server/lib/site/site-config-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getSiteConfig();

  // Return public subset (strip any secret tokens)
  const publicConfig = {
    announcement: config.announcement,
    maintenanceMode: {
      enabled: config.maintenanceMode.enabled,
      message: config.maintenanceMode.message,
    },
    spotlight: config.spotlight,
    features: config.features,
    updatedAt: config.updatedAt,
  };

  return NextResponse.json(publicConfig, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
