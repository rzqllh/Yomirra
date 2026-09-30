import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/server/lib/auth/admin-auth";
import { probeSource } from "@/server/lib/sources/admin-source-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", code: auth.error }, { status: 401 });
  }

  try {
    const { sourceId } = await req.json();
    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
    }

    const result = await probeSource(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
