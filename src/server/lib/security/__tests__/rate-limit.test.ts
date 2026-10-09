import { beforeEach, describe, expect, it, vi } from "vitest";

let mockIsRedisConfigured = true;

vi.mock("@/server/lib/cache/redis", () => ({
  ensureRedisReady: vi.fn(),
  get isRedisConfigured() {
    return mockIsRedisConfigured;
  },
  redis: {
    incr: vi.fn(),
    ttl: vi.fn(),
    expire: vi.fn(),
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

  it("uses the trusted right-most forwarded hop and exposes limit headers", async () => {
    vi.mocked(redis.incr).mockResolvedValueOnce(1);
    vi.mocked(redis.ttl).mockResolvedValueOnce(-1);
    vi.mocked(redis.expire).mockResolvedValueOnce(1);

    const request = new Request("https://yomirra.example/api/sources/search", {
      headers: {
        "x-forwarded-for": "198.51.100.10, 203.0.113.9",
        "x-real-ip": "192.0.2.20",
      },
    });

    const result = await checkRateLimitPolicy(request, "publicSearch");

    expect(redis.incr).toHaveBeenCalledWith(
      "rate-limit:public-search:203.0.113.9"
    );
    expect(vi.mocked(ensureRedisReady).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(redis.incr).mock.invocationCallOrder[0]
    );
    expect(redis.expire).toHaveBeenCalledWith(
      "rate-limit:public-search:203.0.113.9",
      60
    );
    expect(result).toMatchObject({
      success: true,
      headers: {
        "X-RateLimit-Limit": "120",
        "X-RateLimit-Remaining": "119",
        "X-RateLimit-Reset": "60",
      },
    });
  });

  it("fails open for ordinary public search when Redis is unavailable", async () => {
    vi.mocked(redis.incr).mockRejectedValueOnce(new Error("redis unavailable"));

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/sources/search"),
      "publicSearch"
    );

    expect(result.success).toBe(true);
    expect(result.unavailable).toBe(true);
    expect(result.headers["X-RateLimit-Limit"]).toBe("120");
  });

  it("fails closed for admin mutations when Redis is unavailable", async () => {
    vi.mocked(redis.incr).mockRejectedValueOnce(new Error("redis unavailable"));

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
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it("returns 429 with remaining/reset headers when a namespace is exhausted", async () => {
    vi.mocked(redis.incr).mockResolvedValueOnce(31);
    vi.mocked(redis.ttl).mockResolvedValueOnce(42);

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
  });

  it("bypasses Redis commands and fails open for public policy when Redis is not configured", async () => {
    mockIsRedisConfigured = false;

    const result = await checkRateLimitPolicy(
      new Request("https://yomirra.example/api/sources/search"),
      "publicSearch"
    );

    expect(result).toMatchObject({
      success: true,
      unavailable: true,
    });
    expect(ensureRedisReady).not.toHaveBeenCalled();
    expect(redis.incr).not.toHaveBeenCalled();
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
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it("coordinates concurrent rate-limit checks with independent counters", async () => {
    vi.mocked(redis.incr).mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    vi.mocked(redis.ttl).mockResolvedValueOnce(60).mockResolvedValueOnce(60);

    const req1 = new Request("https://yomirra.example/api/sources/search", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    const req2 = new Request("https://yomirra.example/api/sources/search", {
      headers: { "x-forwarded-for": "198.51.100.2" },
    });

    const [res1, res2] = await Promise.all([
      checkRateLimitPolicy(req1, "publicSearch"),
      checkRateLimitPolicy(req2, "publicSearch"),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res1.headers["X-RateLimit-Remaining"]).toBe("119");
    expect(res2.headers["X-RateLimit-Remaining"]).toBe("118");
    expect(redis.incr).toHaveBeenCalledWith(
      "rate-limit:public-search:198.51.100.1"
    );
    expect(redis.incr).toHaveBeenCalledWith(
      "rate-limit:public-search:198.51.100.2"
    );
  });
});
