import { beforeEach, describe, expect, it, vi } from "vitest";

let mockIsRedisConfigured = true;

vi.mock("@/server/lib/cache/redis", () => ({
  ensureRedisReady: vi.fn(),
  get isRedisConfigured() {
    return mockIsRedisConfigured;
  },
  redis: {
    eval: vi.fn(),
  },
}));

import { ensureRedisReady, redis } from "@/server/lib/cache/redis";
import {
  checkRateLimitPolicy,
  createRateLimitRejection,
} from "@/server/lib/security/rate-limit";

describe("route rate-limit policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRedisConfigured = true;
    vi.stubEnv("NODE_ENV", "production");
  });

  it("fails closed for admin mutations when Redis is unavailable", async () => {
    vi.mocked(redis.eval).mockRejectedValueOnce(new Error("redis unavailable"));

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/admin/site/config"),
      "adminMutation",
      "site-config"
    );

    expect(result.success).toBe(false);
    expect(result.unavailable).toBe(true);

    const response = createRateLimitRejection(result);
    expect(response.status).toBe(503);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("fails closed before Redis commands when readiness fails", async () => {
    vi.mocked(ensureRedisReady).mockRejectedValueOnce(
      new Error("redis connection failed")
    );

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/search/intelligence"),
      "searchIntelligence"
    );

    expect(result).toMatchObject({
      success: false,
      unavailable: true,
    });
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("returns 429 with remaining/reset headers when a namespace is exhausted", async () => {
    vi.mocked(redis.eval).mockResolvedValueOnce([31, 42]);

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/admin/reports"),
      "adminMutation",
      "report-status"
    );
    const response = createRateLimitRejection(result);

    expect(result.success).toBe(false);
    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("X-RateLimit-Reset")).toBe("42");
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(redis.eval).toHaveBeenCalledTimes(1);
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("EXPIRE"'),
      1,
      "rate-limit:admin-mutation:report-status:unknown",
      60
    );
  });

  it("bypasses Redis commands and fails closed with 503 for security policy when Redis is not configured", async () => {
    mockIsRedisConfigured = false;

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/admin/site/config"),
      "adminMutation",
      "site-config"
    );

    expect(result).toMatchObject({
      success: false,
      unavailable: true,
    });
    const response = createRateLimitRejection(result);
    expect(response.status).toBe(503);
    expect(ensureRedisReady).not.toHaveBeenCalled();
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("blocks and fails closed for admin mutations when Redis is not ready and times out", async () => {
    vi.mocked(ensureRedisReady).mockRejectedValueOnce(
      new Error("Redis connection timed out waiting for ready state")
    );

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/admin/site/config"),
      "adminMutation",
      "site-config"
    );

    expect(result).toMatchObject({
      success: false,
      unavailable: true,
    });
    expect(ensureRedisReady).toHaveBeenCalledTimes(1);
    expect(redis.eval).not.toHaveBeenCalled();

    const response = createRateLimitRejection(result);
    expect(response.status).toBe(503);
  });

  it("bounds public requests without Redis and preserves independent client counters", async () => {
    mockIsRedisConfigured = false;
    const request = new Request("https://yomirra.example/api/sources/search", {
      headers: { "x-forwarded-for": "198.51.100.10, 203.0.113.9" },
    });
    const results = await Promise.all(Array.from({ length: 120 }, () =>
      checkRateLimitPolicy(request, "publicSearch")
    ));
    expect(results.every((result) => result.success)).toBe(true);
    expect(results.at(-1)?.headers["X-RateLimit-Remaining"]).toBe("0");

    const sameClient = new Request(request.url, {
      headers: { "x-forwarded-for": "198.51.100.20, 203.0.113.9" },
    });
    const rejected = await checkRateLimitPolicy(sameClient, "publicSearch");
    expect(createRateLimitRejection(rejected).status).toBe(429);
    const otherClient = new Request(request.url, {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    expect((await checkRateLimitPolicy(otherClient, "publicSearch")).success).toBe(true);
    expect(ensureRedisReady).not.toHaveBeenCalled();
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("keeps paid AI admission fail-closed during a Redis outage", async () => {
    mockIsRedisConfigured = false;
    const result = await checkRateLimitPolicy(new Request("https://yomirra.example/api/ai/ocr"), "publicAi");
    expect(createRateLimitRejection(result).status).toBe(503);
    expect(ensureRedisReady).not.toHaveBeenCalled();
  });
});
