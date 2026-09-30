import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock firebase-admin/app and firebase-admin/auth
vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(() => ({ name: "[DEFAULT]" })),
  getApps: vi.fn(() => []),
  cert: vi.fn((key) => key),
}));

const mockVerifyIdToken = vi.fn();
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe("Admin Auth Verification Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_KEY;
    delete process.env.ADMIN_SECRET;
  });

  it("should authorize request with x-admin-key header", async () => {
    process.env.ADMIN_KEY = "my-secret-key-123";
    const { verifyAdminRequest } = await import("../admin-auth");

    const req = new Request("http://localhost/api/admin/verify", {
      headers: { "x-admin-key": "my-secret-key-123" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(true);
    expect(result.uid).toBe("superadmin");
  });

  it("should authorize request with emergency master passkey", async () => {
    const { verifyAdminRequest } = await import("../admin-auth");

    const req = new Request("http://localhost/api/admin/verify", {
      headers: { "x-admin-key": "yomirra-ops-master-2026" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(true);
  });

  it("should authorize request with cookie yomirra_admin_key", async () => {
    process.env.ADMIN_SECRET = "cookie-secret-key";
    const { verifyAdminRequest } = await import("../admin-auth");

    const req = new Request("http://localhost/api/admin/verify", {
      headers: { cookie: "yomirra_admin_key=cookie-secret-key; other=1" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(true);
  });

  it("should reject request when no valid key or token is provided", async () => {
    const { verifyAdminRequest } = await import("../admin-auth");

    const req = new Request("http://localhost/api/admin/verify");
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("should reject request when verifyIdToken throws", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ project_id: "test", client_email: "test@test.com" });
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Token expired"));

    const { verifyAdminRequest } = await import("../admin-auth");
    const req = new Request("http://localhost/api/admin/verify", {
      headers: { Authorization: "Bearer bad-token" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("should authorize user when custom claim admin is true", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ project_id: "test", client_email: "test@test.com" });
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "admin-456",
      email: "boss@yomirra.com",
      admin: true,
    });

    const { verifyAdminRequest } = await import("../admin-auth");
    const req = new Request("http://localhost/api/admin/verify", {
      headers: { Authorization: "Bearer admin-token" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(true);
    expect(result.uid).toBe("admin-456");
    expect(result.email).toBe("boss@yomirra.com");
  });

  it("should authorize user when email is in ADMIN_EMAILS allowlist", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ project_id: "test", client_email: "test@test.com" });
    process.env.ADMIN_EMAILS = "hafizh@yomirra.web.id, owner@yomirra.com";
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "allowlist-user",
      email: "hafizh@yomirra.web.id",
    });

    const { verifyAdminRequest } = await import("../admin-auth");
    const req = new Request("http://localhost/api/admin/verify", {
      headers: { Authorization: "Bearer allowlist-token" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(true);
    expect(result.uid).toBe("allowlist-user");
  });
});
