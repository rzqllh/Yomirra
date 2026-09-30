import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { getSourceHealthMatrix } from "@/server/lib/sources/admin-source-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
  }

  const matrix = await getSourceHealthMatrix();
  return NextResponse.json({ sources: matrix });
}
