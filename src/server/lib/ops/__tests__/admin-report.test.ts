import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock redis
const mockLpush = vi.fn();
const mockLtrim = vi.fn();
const mockLrange = vi.fn();
const mockSet = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  redis: {
    lpush: (...args: any[]) => mockLpush(...args),
    ltrim: (...args: any[]) => mockLtrim(...args),
    lrange: (...args: any[]) => mockLrange(...args),
    set: (...args: any[]) => mockSet(...args),
  },
}));

describe("Admin User Report Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enqueue a new report to Redis list", async () => {
    mockLpush.mockResolvedValueOnce(1);
    mockLtrim.mockResolvedValueOnce("OK");

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
    expect(mockLpush).toHaveBeenCalledWith(
      "yomirra:reports:list",
      expect.stringContaining("solo-leveling")
    );
    expect(mockLtrim).toHaveBeenCalledWith("yomirra:reports:list", 0, 199);
  });

  it("should retrieve reports with optional status filtering", async () => {
    const mockItems = [
      JSON.stringify({ id: "1", status: "pending", category: "Cat 1" }),
      JSON.stringify({ id: "2", status: "resolved", category: "Cat 2" }),
    ];
    mockLrange.mockResolvedValueOnce(mockItems);

    const { getStoredUserReports } = await import("../admin-report-service");
    const pendingOnly = await getStoredUserReports("pending");

    expect(pendingOnly.length).toBe(1);
    expect(pendingOnly[0].id).toBe("1");
  });
});
