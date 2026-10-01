import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminRequest,
} from "@/server/lib/auth/admin-auth";

const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;
const LEGACY_ADMIN_KEY_COOKIE = "yomirra_admin_key";

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: 0,
  });
}

function clearLegacyAdminKeyCookie(response: NextResponse) {
  response.cookies.set({
    name: LEGACY_ADMIN_KEY_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAdmin) {
    const response = NextResponse.json(
      { authenticated: false, code: auth.error || "unauthorized" },
      { status: auth.error === "unconfigured" ? 503 : 401 },
    );
    clearLegacyAdminKeyCookie(response);
    return response;
  }

  const response = NextResponse.json({
    authenticated: true,
    admin: {
      uid: auth.uid,
      email: auth.email,
      method: auth.method,
    },
  });
  clearLegacyAdminKeyCookie(response);
  return response;
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin authentication is not configured", code: "unconfigured" },
      { status: 503 },
    );
  }

  let passkey = "";
  try {
    const body = (await request.json()) as { passkey?: unknown };
    passkey = typeof body.passkey === "string" ? body.passkey.trim() : "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request", code: "invalid_request" },
      { status: 400 },
    );
  }

  if (!passkey) {
    return NextResponse.json(
      { error: "Passkey is required", code: "missing_token" },
      { status: 400 },
    );
  }

  const authRequest = new Request(request.url, {
    method: "GET",
    headers: { "x-admin-key": passkey },
  });
  const auth = await verifyAdminRequest(authRequest);

  if (!auth.isAdmin || auth.method !== "api_key") {
    return NextResponse.json(
      { error: "Unauthorized", code: auth.error || "invalid_token" },
      { status: 401 },
    );
  }

  const token = createAdminSessionToken(auth.uid, auth.email, ADMIN_SESSION_MAX_AGE);
  if (!token) {
    return NextResponse.json(
      { error: "Admin session signing is not configured", code: "unconfigured" },
      { status: 503 },
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    admin: {
      uid: auth.uid,
      email: auth.email,
      method: "session",
    },
  });
  setSessionCookie(response, token);
  clearLegacyAdminKeyCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearSessionCookie(response);
  clearLegacyAdminKeyCookie(response);
  return response;
}
