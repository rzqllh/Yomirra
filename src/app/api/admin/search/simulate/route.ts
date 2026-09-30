import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { simulateSearchRanking } from "@/server/lib/search/admin-search-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const simulation = await simulateSearchRanking(query);
    return NextResponse.json(simulation);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
