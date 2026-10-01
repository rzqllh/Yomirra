import { beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.unstubAllEnvs();

    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_KEY;
    delete process.env.ADMIN_SECRET;
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.OPS_CRON_SECRET;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it("fails closed when admin authentication is unconfigured", async () => {
    const { verifyAdminRequest } = await import("../admin-auth");

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources"),
    );

    expect(result).toMatchObject({
      isAdmin: false,
      uid: "",
      error: "unconfigured",
    });
  });

  it("authorizes a configured x-admin-key", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    const { verifyAdminRequest } = await import("../admin-auth");

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { "x-admin-key": "configured-admin-key" },
      }),
    );

    expect(result).toMatchObject({
      isAdmin: true,
      uid: "admin-key",
      method: "api_key",
    });
  });

  it("does not accept unrelated operational secrets as admin keys", async () => {
    process.env.ADMIN_KEY = "real-admin-key";
    process.env.OPS_CRON_SECRET = "cron-secret";
    process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-secret";
    const { verifyAdminRequest } = await import("../admin-auth");

    const cronResult = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { "x-admin-key": "cron-secret" },
      }),
    );
    const telegramResult = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { "x-admin-key": "telegram-secret" },
      }),
    );

    expect(cronResult.isAdmin).toBe(false);
    expect(telegramResult.isAdmin).toBe(false);
  });

  it("does not accept the legacy raw admin-key cookie", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    const { verifyAdminRequest } = await import("../admin-auth");

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { cookie: "yomirra_admin_key=configured-admin-key" },
      }),
    );

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("authorizes a valid signed admin session for GET requests", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyAdminRequest } =
      await import("../admin-auth");
    const token = createAdminSessionToken("admin-key");

    expect(token).toBeTruthy();

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
      }),
    );

    expect(result).toMatchObject({
      isAdmin: true,
      uid: "admin-key",
      method: "session",
    });
  });

  it("rejects session-authenticated mutations without a same-origin Origin header", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyAdminRequest } =
      await import("../admin-auth");
    const token = createAdminSessionToken("admin-key")!;

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        method: "POST",
        headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
      }),
    );

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("csrf_rejected");
  });

  it("allows session-authenticated mutations with a same-origin Origin header", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyAdminRequest } =
      await import("../admin-auth");
    const token = createAdminSessionToken("admin-key")!;

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        method: "POST",
        headers: {
          cookie: `${ADMIN_SESSION_COOKIE}=${token}`,
          origin: "https://yomirra.example",
        },
      }),
    );

    expect(result.isAdmin).toBe(true);
  });

  it("rejects expired signed sessions", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const { createAdminSessionToken, verifyAdminSessionToken } =
      await import("../admin-auth");
    const token = createAdminSessionToken("admin-key", undefined, -1)!;

    const result = verifyAdminSessionToken(token);

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("rejects tampered signed sessions", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const { createAdminSessionToken, verifyAdminSessionToken } =
      await import("../admin-auth");
    const token = createAdminSessionToken("admin-key")!;
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    const result = verifyAdminSessionToken(tampered);

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("rejects a request without credentials when admin auth is configured", async () => {
    process.env.ADMIN_KEY = "configured-admin-key";
    const { verifyAdminRequest } = await import("../admin-auth");

    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources"),
    );

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("rejects an invalid Firebase token", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      project_id: "test",
      client_email: "test@test.com",
    });
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Token expired"));

    const { verifyAdminRequest } = await import("../admin-auth");
    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { authorization: "Bearer bad-token" },
      }),
    );

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("invalid_token");
  });

  it("authorizes Firebase users with the admin custom claim", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      project_id: "test",
      client_email: "test@test.com",
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "admin-456",
      email: "boss@example.com",
      admin: true,
    });

    const { verifyAdminRequest } = await import("../admin-auth");
    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { authorization: "Bearer admin-token" },
      }),
    );

    expect(result).toMatchObject({
      isAdmin: true,
      uid: "admin-456",
      email: "boss@example.com",
      method: "firebase",
    });
  });

  it("authorizes Firebase users in the configured email allowlist", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      project_id: "test",
      client_email: "test@test.com",
    });
    process.env.ADMIN_EMAILS = "admin@example.com, owner@example.com";
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "allowlist-user",
      email: "admin@example.com",
    });

    const { verifyAdminRequest } = await import("../admin-auth");
    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { authorization: "Bearer allowlist-token" },
      }),
    );

    expect(result.isAdmin).toBe(true);
    expect(result.uid).toBe("allowlist-user");
  });

  it("rejects Firebase users without an admin claim or allowlisted email", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      project_id: "test",
      client_email: "test@test.com",
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "regular-user",
      email: "reader@example.com",
    });

    const { verifyAdminRequest } = await import("../admin-auth");
    const result = await verifyAdminRequest(
      new Request("https://yomirra.example/api/admin/sources", {
        headers: { authorization: "Bearer reader-token" },
      }),
    );

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe("not_admin");
  });
});
