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
  });

  it("should fail-closed when Firebase Admin is unconfigured", async () => {
    const { verifyAdminRequest, isFirebaseAdminConfigured } = await import("../admin-auth");
    expect(isFirebaseAdminConfigured()).toBe(false);

    const req = new Request("http://localhost/api/admin/verify", {
      headers: { Authorization: "Bearer some-token" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("unconfigured");
  });

  it("should reject request when Authorization header is missing", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ project_id: "test", client_email: "test@test.com" });
    const { verifyAdminRequest, isFirebaseAdminConfigured } = await import("../admin-auth");
    expect(isFirebaseAdminConfigured()).toBe(true);

    const req = new Request("http://localhost/api/admin/verify");
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("missing_token");
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

  it("should reject valid token if user lacks admin claim and is not in allowlist", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ project_id: "test", client_email: "test@test.com" });
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "user-123",
      email: "reader@gmail.com",
      admin: false,
    });

    const { verifyAdminRequest } = await import("../admin-auth");
    const req = new Request("http://localhost/api/admin/verify", {
      headers: { Authorization: "Bearer user-token" },
    });
    const result = await verifyAdminRequest(req);
    expect(result.isAdmin).toBe(false);
    expect(result.uid).toBe("user-123");
    expect(result.error).toBe("not_admin");
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
