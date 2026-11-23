export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ADULT_SESSION_COOKIE, createVerifiedAdultSession } from "@/server/lib/auth/admin-auth";

const AGE_SESSION_SECONDS = 60 * 60;

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: { code: "CONTENT_RESTRICTED", message: "Permintaan ditolak." } }, { status: 403 });
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const session = await createVerifiedAdultSession(token);
  if (!session) {
    return NextResponse.json({
      error: { code: "CONTENT_RESTRICTED", message: "Akun belum memiliki verifikasi usia 18+." },
    }, { status: 403 });
  }
  const response = NextResponse.json({ data: { verified: true } });
  response.cookies.set(ADULT_SESSION_COOKIE, session, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: AGE_SESSION_SECONDS,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  const response = NextResponse.json({ data: { verified: false } });
  response.cookies.set(ADULT_SESSION_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 0,
  });
  return response;
}
