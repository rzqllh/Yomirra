import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }

  const sources = getAllSourceMetadata();
  
  const nsfwRaw = process.env.SECRET_EXTENSION_SOURCES;
  if (nsfwRaw) {
    try {
      const nsfwSources: import("@/shared/sources/source-types").SourceMetadata[] = JSON.parse(nsfwRaw);
      nsfwSources.forEach(s => s.isNsfw = true);
      sources.push(...nsfwSources);
    } catch (e) {
      console.error("Failed to parse SECRET_EXTENSION_SOURCES in sources route", e);
    }
  }

  return NextResponse.json({ data: sources });
}
