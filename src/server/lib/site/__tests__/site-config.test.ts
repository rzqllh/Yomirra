import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { SiteConfig } from "@/shared/types/site-config";

// Mock redis
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockEnsureRedisReady = vi.fn().mockResolvedValue(undefined);
let mockIsRedisConfigured = true;

vi.mock("@/server/lib/cache/redis", () => ({
  get isRedisConfigured() {
    return mockIsRedisConfigured;
  },
  ensureRedisReady: () => mockEnsureRedisReady(),
  redis: {
    get: (...args: any[]) => mockRedisGet(...args),
    set: (...args: any[]) => mockRedisSet(...args),
  },
}));

describe("Site Config Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRedisConfigured = true;
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return default config if redis has no value", async () => {
    mockRedisGet.mockResolvedValueOnce(null);

    const { getSiteConfig } = await import("../site-config-service");

    const config = await getSiteConfig();
    expect(config.announcement.enabled).toBe(false);
    expect(config.features.semanticSearchEnabled).toBe(true);
    expect(mockEnsureRedisReady).toHaveBeenCalled();
  });

  it("should parse and return stored config from Redis", async () => {
    const mockStored: Partial<SiteConfig> = {
      announcement: {
        id: "announce-1",
        enabled: true,
        message: "Scheduled maintenance tonight",
        type: "warning",
      },
      updatedAt: "2026-03-30T10:00:00Z",
    };
    mockRedisGet.mockResolvedValueOnce(JSON.stringify(mockStored));

    const { getSiteConfig } = await import("../site-config-service");

    const config = await getSiteConfig();
    expect(config.announcement.enabled).toBe(true);
    expect(config.announcement.message).toBe("Scheduled maintenance tonight");
    expect(config.features.semanticSearchEnabled).toBe(true); // default maintained
  });

  it("should update and persist config to Redis when configured", async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockRedisSet.mockResolvedValueOnce("OK");

    const { updateSiteConfig } = await import("../site-config-service");

    const updated = await updateSiteConfig({
      announcement: {
        id: "announce-2",
        enabled: true,
        message: "New update available!",
        type: "info",
      },
    });

    expect(updated.announcement.enabled).toBe(true);
    expect(updated.announcement.message).toBe("New update available!");
    expect(mockEnsureRedisReady).toHaveBeenCalled();
    expect(mockRedisSet).toHaveBeenCalledWith(
      "yomirra:site:config",
      expect.stringContaining("New update available!")
    );
  });

  it("should reject when Redis durable write fails and prevent false persistence success", async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockRedisSet.mockRejectedValueOnce(new Error("Connection is closed."));

    const { updateSiteConfig, getSiteConfig } = await import("../site-config-service");

    await expect(
      updateSiteConfig({
        maintenanceMode: {
          enabled: true,
          message: "Down for emergency maintenance",
        },
      })
    ).rejects.toThrow("Failed to persist site config to durable storage");

    // Ensure fallback did not optimistically record maintenance mode
    const current = await getSiteConfig();
    expect(current.maintenanceMode.enabled).toBe(false);
  });

  it("should reject in production when Redis is not configured", async () => {
    mockIsRedisConfigured = false;
    vi.stubEnv("NODE_ENV", "production");

    const { updateSiteConfig } = await import("../site-config-service");

    await expect(
      updateSiteConfig({
        announcement: { id: "announce-prod", enabled: true, message: "Prod without Redis", type: "info" },
      })
    ).rejects.toThrow("Failed to persist site config: durable storage is required in production");
  });

  it("should permit in-memory fallback in test/development when Redis is not configured", async () => {
    mockIsRedisConfigured = false;
    vi.stubEnv("NODE_ENV", "test");

    const { updateSiteConfig, getSiteConfig } = await import("../site-config-service");

    const updated = await updateSiteConfig({
      announcement: { id: "announce-dev", enabled: true, message: "Dev in-memory test", type: "info" },
    });

    expect(updated.announcement.enabled).toBe(true);
    expect(updated.announcement.message).toBe("Dev in-memory test");
    const current = await getSiteConfig();
    expect(current.announcement.message).toBe("Dev in-memory test");
  });
});
