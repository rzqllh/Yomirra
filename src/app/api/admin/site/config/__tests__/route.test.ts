import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../route";
import * as siteConfigService from "@/server/lib/site/site-config-service";
import * as adminAuth from "@/server/lib/auth/admin-auth";
import * as rateLimit from "@/server/lib/security/rate-limit";

vi.mock("@/server/lib/auth/admin-auth", () => ({
  requireAdminAuth: vi.fn(),
}));

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: vi.fn(),
  createRateLimitRejection: vi.fn(),
}));

vi.mock("@/server/lib/admin/audit-service", () => ({
  recordAdminAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/lib/site/site-config-service", () => ({
  getSiteConfig: vi.fn(),
  updateSiteConfig: vi.fn(),
}));

describe("Admin Site Config Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminAuth.requireAdminAuth).mockResolvedValue({
      authorized: true,
      admin: { uid: "admin-1", email: "admin@yomirra.test" } as any,
    });
    vi.mocked(rateLimit.checkRateLimitPolicy).mockResolvedValue({
      success: true,
    } as any);
  });

  it("GET returns current configuration when authorized", async () => {
    vi.mocked(siteConfigService.getSiteConfig).mockResolvedValue({
      announcement: { enabled: false },
    } as any);

    const req = new NextRequest("http://localhost/api/admin/site/config");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("PATCH returns 500 when durable persistence fails", async () => {
    vi.mocked(siteConfigService.updateSiteConfig).mockRejectedValue(
      new Error("Failed to persist site config to durable storage")
    );

    const req = new NextRequest("http://localhost/api/admin/site/config", {
      method: "PATCH",
      body: JSON.stringify({ announcement: { enabled: true } }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Gagal memperbarui konfigurasi situs");
  });

  it("PATCH returns 500 with sanitized error when production durable storage is required", async () => {
    vi.mocked(siteConfigService.updateSiteConfig).mockRejectedValue(
      new Error("Failed to persist site config: durable storage is required in production")
    );

    const req = new NextRequest("http://localhost/api/admin/site/config", {
      method: "PATCH",
      body: JSON.stringify({ announcement: { enabled: true } }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Gagal memperbarui konfigurasi situs");
    // Ensure raw operational internals or credentials are not exposed
    expect(JSON.stringify(json)).not.toContain("redis://");
  });
});
