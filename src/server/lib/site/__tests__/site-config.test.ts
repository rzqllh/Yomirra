import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_SITE_CONFIG, type SiteConfig } from "@/shared/types/site-config";

// Mock redis
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  redis: {
    get: (...args: any[]) => mockRedisGet(...args),
    set: (...args: any[]) => mockRedisSet(...args),
  },
}));

describe("Site Config Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return DEFAULT_SITE_CONFIG when Redis is empty or null", async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    const { getSiteConfig } = await import("../site-config-service");

    const config = await getSiteConfig();
    expect(config.announcement.enabled).toBe(false);
    expect(config.features.semanticSearchEnabled).toBe(true);
  });

  it("should parse and return stored config from Redis", async () => {
    const stored: Partial<SiteConfig> = {
      announcement: {
        enabled: true,
        message: "Server maintenance at 02:00 WIB",
        type: "warning",
        id: "msg-123",
      },
      updatedAt: "2026-09-30T10:00:00Z",
    };
    mockRedisGet.mockResolvedValueOnce(JSON.stringify(stored));
    const { getSiteConfig } = await import("../site-config-service");

    const config = await getSiteConfig();
    expect(config.announcement.enabled).toBe(true);
    expect(config.announcement.message).toBe("Server maintenance at 02:00 WIB");
    expect(config.announcement.type).toBe("warning");
    // Merged with defaults
    expect(config.features.semanticSearchEnabled).toBe(true);
  });

  it("should merge partial updates and persist to Redis", async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockRedisSet.mockResolvedValueOnce("OK");

    const { updateSiteConfig } = await import("../site-config-service");
    const updated = await updateSiteConfig({
      announcement: {
        enabled: true,
        message: "New update available!",
        type: "info",
        id: "msg-new",
      },
    });

    expect(updated.announcement.enabled).toBe(true);
    expect(updated.announcement.message).toBe("New update available!");
    expect(mockRedisSet).toHaveBeenCalledWith(
      "yomirra:site:config",
      expect.stringContaining("New update available!")
    );
  });
});
