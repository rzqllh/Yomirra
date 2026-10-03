import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: false,
  redis: null,
}));

import { recordAdminAudit, getAdminAuditLog } from "../audit-service";
import { GET } from "@/app/api/admin/audit/route";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/auth/admin-auth", () => ({
  requireAdminAuth: vi.fn(async () => ({
    authorized: true,
    admin: { uid: "test-admin-uid", email: "admin@yomirra.example" },
  })),
}));

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: vi.fn(async () => ({ success: true, headers: {} })),
  createRateLimitRejection: vi.fn(),
}));

describe("Admin Audit Trail (Phase L)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records privileged actions with timestamp and actor metadata", async () => {
    const entry = await recordAdminAudit({
      actor: { uid: "admin-1", email: "operator@example.com" },
      action: "source.override.update",
      targetType: "source",
      targetId: "komiku",
      summary: "Disabled source komiku",
      metadata: { isEnabled: false },
    });

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.actor.uid).toBe("admin-1");
    expect(entry.actor.email).toBe("operator@example.com");
    expect(entry.action).toBe("source.override.update");
    expect(entry.targetId).toBe("komiku");
  });

  it("strictly scrubs sensitive keys like secrets, tokens, passwords from metadata", async () => {
    const entry = await recordAdminAudit({
      actor: { uid: "admin-1" },
      action: "site.config.update",
      targetType: "site_config",
      summary: "Updated config",
      metadata: {
        safeField: "active",
        apiKey: "super-secret-key-123",
        authToken: "bearer-token-xyz",
        password: "admin-password",
        secretVal: "ops-secret",
      },
    });

    expect(entry.metadata?.safeField).toBe("active");
    expect(entry.metadata?.apiKey).toBeUndefined();
    expect(entry.metadata?.authToken).toBeUndefined();
    expect(entry.metadata?.password).toBeUndefined();
    expect(entry.metadata?.secretVal).toBeUndefined();
  });

  it("retrieves audit log respecting limit parameter", async () => {
    for (let i = 0; i < 5; i++) {
      await recordAdminAudit({
        actor: { uid: `admin-${i}` },
        action: `action-${i}`,
        targetType: "test",
        summary: `Action ${i}`,
      });
    }

    const log = await getAdminAuditLog(3);
    expect(log.length).toBe(3);
    expect(log[0].action).toBe("action-4"); // Most recent first
  });

  it("handles GET /api/admin/audit route successfully", async () => {
    const req = new NextRequest("https://yomirra.example/api/admin/audit?limit=10");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.auditLog)).toBe(true);
  });
});
