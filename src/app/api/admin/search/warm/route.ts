import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { warmSearchCatalog } from "@/server/lib/search/admin-search-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
  }

  const result = await warmSearchCatalog();
  return NextResponse.json({ success: true, ...result });
}
