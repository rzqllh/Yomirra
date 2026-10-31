import { NextResponse } from "next/server";
import { getMalPopular } from "@/server/lib/metadata/mal-popular";
import { getServerReadOptions } from "@/server/lib/sources/content-access";
export async function GET() {
  const options = await getServerReadOptions();
  const feed = await getMalPopular(options.hideNsfw !== false);
  if (feed.status !== "ready") return NextResponse.json({ error: { code: feed.status === "unconfigured" ? "MAL_NOT_CONFIGURED" : "MAL_UNAVAILABLE", message: feed.message } }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.json({ data: feed }, { headers: { "Cache-Control": "private, no-store" } });
}
