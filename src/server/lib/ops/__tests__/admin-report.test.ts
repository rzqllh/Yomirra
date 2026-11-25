import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock redis
const mockEval = vi.fn();
const mockLrange = vi.fn();
const mockReady = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  ensureRedisReady: () => mockReady(),
  redis: {
    eval: (...args: any[]) => mockEval(...args),
    lrange: (...args: any[]) => mockLrange(...args),
  },
}));

describe("Admin User Report Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockReady.mockResolvedValue(undefined);
  });

  it("should enqueue a new report to Redis list", async () => {
    mockEval.mockResolvedValueOnce(1);

    const { enqueueUserReport } = await import("../admin-report-service");
    const report = await enqueueUserReport({
      type: "image_broken",
      category: "Gambar tidak muncul",
      sourceId: "shinigami",
      mangaId: "solo-leveling",
      chapterId: "ch-100",
      pageIndex: 4,
    });

    expect(report.id).toBeDefined();
    expect(report.status).toBe("pending");
    expect(mockReady).toHaveBeenCalledTimes(1);
    expect(mockEval).toHaveBeenCalledTimes(1);
    expect(mockEval).toHaveBeenCalledWith(
      expect.stringContaining("LTRIM"), 1, "yomirra:reports:list",
      expect.stringContaining("solo-leveling")
    );
    const script=mockEval.mock.calls[0][0];
    expect(script).toContain("LPUSH");
    expect(script).not.toContain("DEL");
  });

  it("should retrieve reports with optional status filtering", async () => {
    const mockItems = [
      JSON.stringify({ id: "1", status: "pending", category: "Cat 1" }),
      JSON.stringify({ id: "2", status: "resolved", category: "Cat 2" }),
    ];
    mockLrange.mockResolvedValueOnce(mockItems);

    const { getStoredUserReports } = await import("../admin-report-service");
    const pendingOnly = await getStoredUserReports("pending");

    expect(mockReady).toHaveBeenCalledTimes(1);
    expect(mockLrange).toHaveBeenCalledWith("yomirra:reports:list",0,199);
    expect(pendingOnly.length).toBe(1);
    expect(pendingOnly[0].id).toBe("1");
  });
});
