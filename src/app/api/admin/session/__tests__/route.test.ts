import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: vi.fn().mockResolvedValue({ success: true, headers: {} }),
  createRateLimitRejection: vi.fn((rateLimit: { unavailable?: boolean; headers: Record<string, string> }) =>
    new Response(
      JSON.stringify({ error: { message: rateLimit.unavailable ? "Service temporarily unavailable" : "Too Many Requests" } }),
      {
        status: rateLimit.unavailable ? 503 : 429,
        headers: {
          "content-type": "application/json",
          ...rateLimit.headers,
          "Retry-After": rateLimit.headers["X-RateLimit-Reset"] || "60",
        },
      }
    )
  ),
}));

import { DELETE, GET, POST } from "../route";
import { checkRateLimitPolicy } from "@/server/lib/security/rate-limit";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from "@/server/lib/auth/admin-auth";

describe("Admin session route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("rate limits session exchange before validating a configured passkey", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    vi.mocked(checkRateLimitPolicy).mockResolvedValueOnce({
      success: false,
      headers: {
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "27",
      },
    });

    const request = new NextRequest("https://yomirra.example/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passkey: "configured-admin-key" }),
    });

    const response = await POST(request);

    expect(checkRateLimitPolicy).toHaveBeenCalledWith(
      request,
      "adminMutation",
      "session-login"
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("Retry-After")).toBe("27");
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
    expect(setCookie).toContain("yomirra_admin_key=");
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
    expect(setCookie).toContain("yomirra_admin_key=");
  });
});
