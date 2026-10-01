import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, POST } from "../route";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from "@/server/lib/auth/admin-auth";

describe("Admin session route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.ADMIN_KEY;
    delete process.env.ADMIN_SECRET;
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  });

  it("fails closed when passkey authentication is unconfigured", async () => {
    const request = new NextRequest("https://yomirra.example/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passkey: "anything" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ code: "unconfigured" });
  });

  it("rejects an invalid passkey without issuing a session cookie", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const request = new NextRequest("https://yomirra.example/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passkey: "wrong-key" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("exchanges a valid passkey for an HttpOnly signed session cookie", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const request = new NextRequest("https://yomirra.example/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passkey: "configured-admin-key" }),
    });

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
    expect(setCookie).not.toContain("configured-admin-key");
  });

  it("reports an authenticated signed session", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const token = createAdminSessionToken("admin-key")!;
    const request = new NextRequest("https://yomirra.example/api/admin/session", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      admin: { uid: "admin-key", method: "session" },
    });
  });

  it("clears the signed session cookie on logout", async () => {
    const response = await DELETE();
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});
