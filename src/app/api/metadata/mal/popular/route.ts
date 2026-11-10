import { NextRequest, NextResponse } from "next/server";
import { getMalPopular, MAL_RANKING_TYPES } from "@/server/lib/metadata/mal-popular";
import type { MalRankingType } from "@/shared/types/mal";
import { getServerReadOptions } from "@/server/lib/sources/content-access";

export async function GET(request: NextRequest) {
  const options = await getServerReadOptions();
  const searchParams = request.nextUrl.searchParams;
  const requestedType = searchParams.get("type") as MalRankingType | null;
  const rankingType = requestedType && MAL_RANKING_TYPES.includes(requestedType) ? requestedType : "bypopularity";

  const feed = await getMalPopular(options.hideNsfw !== false, rankingType);
  if (feed.status !== "ready") {
    return NextResponse.json(
      { error: { code: feed.status === "unconfigured" ? "MAL_NOT_CONFIGURED" : "MAL_UNAVAILABLE", message: feed.message } },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
  return NextResponse.json({ data: feed }, { headers: { "Cache-Control": "private, no-store" } });
}
