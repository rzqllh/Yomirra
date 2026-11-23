export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getDiscoveryRuntimeSources } from "@/server/lib/sources/discovery-runtime-sources";
import { getVerifiedRequestReadOptions } from "@/server/lib/sources/content-access";
import { isSourceContentVisible } from "@/shared/sources/content-policy";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan. Coba lagi nanti." } }, { status: 429, headers: rateLimit.headers });
  }

  const [sources, options] = await Promise.all([getDiscoveryRuntimeSources(), getVerifiedRequestReadOptions(request)]);
  return NextResponse.json({ data: sources.filter(source => isSourceContentVisible(source, options.hideNsfw !== false)) });
}

