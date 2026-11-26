import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authorized: true,
  rateLimited: false,
  flushSourceCache: vi.fn(),
  probeSource: vi.fn(),
  updateReportStatus: vi.fn(),
  recordAdminAudit: vi.fn(),
}));

vi.mock("@/server/lib/auth/admin-auth", () => ({
  requireAdminAuth: async () =>
    state.authorized
      ? { authorized: true, admin: { uid: "admin-1", email: "owner@yomirra.test" } }
      : { authorized: false, response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) },
}));

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: async () =>
    state.rateLimited ? { success: false, headers: {} } : { success: true, headers: {} },
  createRateLimitRejection: () => new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 }),
}));

vi.mock("@/server/lib/sources/admin-source-service", () => ({
  flushSourceCache: state.flushSourceCache,
  probeSource: state.probeSource,
}));

vi.mock("@/server/lib/ops/admin-report-service", () => ({
  updateReportStatus: state.updateReportStatus,
}));

vi.mock("@/server/lib/admin/audit-service", () => ({
  recordAdminAudit: state.recordAdminAudit,
}));

vi.mock("@/shared/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST } from "../route";

describe("POST /api/admin/reports/action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.authorized = true;
    state.rateLimited = false;
    state.recordAdminAudit.mockResolvedValue(undefined);
  });

  it("rejects malformed or oversized request payloads with 400", async () => {
    const malformed = await POST(
      new Request("http://localhost/api/admin/reports/action", {
        method: "POST",
        body: "{not-json",
      })
    );
    expect(malformed.status).toBe(400);

    const oversized = await POST(
      new Request("http://localhost/api/admin/reports/action", {
        method: "POST",
        body: JSON.stringify({ action: "resolve", reportId: "x".repeat(2048) }),
      })
    );
    expect(oversized.status).toBe(400);
    expect(state.updateReportStatus).not.toHaveBeenCalled();
  });

  it("returns 404 without writing an audit entry when resolving a non-existent report", async () => {
    state.updateReportStatus.mockResolvedValueOnce(null);

    const res = await POST(
      new Request("http://localhost/api/admin/reports/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", reportId: "rep_missing" }),
      })
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Report not found" });
    expect(state.recordAdminAudit).not.toHaveBeenCalled();
  });

  it("returns 503 instead of 400 when report storage is unavailable", async () => {
    state.updateReportStatus.mockRejectedValueOnce(new Error("REPORT_STORAGE_UNAVAILABLE"));

    const res = await POST(
      new Request("http://localhost/api/admin/reports/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", reportId: "rep_123" }),
      })
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Report storage unavailable" });
    expect(state.recordAdminAudit).not.toHaveBeenCalled();
  });
});
