import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { flushSourceCache } from "@/server/lib/sources/admin-source-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : undefined;

    const result = await flushSourceCache(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to flush cache" }, { status: 500 });
  }
}
