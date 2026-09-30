export const dynamic = "force-dynamic";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }

  const sources = await getRuntimeSources();
  return NextResponse.json({ data: sources });
}

