import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { useUpdateStore } from "@/shared/store/update-store";
import { scanLibraryUpdates, DEFAULT_COOLDOWN_MS } from "../update-checker";
import { apiClient } from "@/shared/api-client";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getChapters: vi.fn(),
  },
}));

describe("UpdateChecker Engine (Slice 1.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
    useUpdateStore.setState({ items: {} });
  });

  it("returns zero counts when library is empty", async () => {
    const res = await scanLibraryUpdates();
    expect(res.totalScanned).toBe(0);
    expect(res.updatesDetected).toBe(0);
    expect(apiClient.getChapters).not.toHaveBeenCalled();
  });

  it("seeds baseline on initial scan without triggering unread count", async () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Solo Leveling",
          coverUrl: "http://example.com/cover.jpg",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch100", mangaId: "m1", number: 100, title: "Chapter 100", date: "2026-08-01" },
      { id: "ch99", mangaId: "m1", number: 99, title: "Chapter 99", date: "2026-07-25" },
    ]);

    const res = await scanLibraryUpdates({ forceRefresh: true });

    expect(res.totalScanned).toBe(1);
    expect(res.updatesDetected).toBe(0); // Baseline seeded, no new update alert

    const update = useUpdateStore.getState().getUpdate("srcA", "m1");
    expect(update).toBeDefined();
    expect(update?.latestChapterId).toBe("ch100");
    expect(update?.latestChapterNumber).toBe(100);
    expect(update?.seenAt).toBeDefined(); // Seen by default on baseline
    expect(useUpdateStore.getState().getUnreadCount()).toBe(0);
  });

  it("detects subsequent new chapter and increments unread count", async () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Solo Leveling",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    // Existing update already established
    useUpdateStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          mangaTitle: "Solo Leveling",
          latestChapterId: "ch100",
          latestChapterNumber: 100,
          detectedAt: new Date().toISOString(),
          seenAt: new Date().toISOString(),
          lastCheckedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch101", mangaId: "m1", number: 101, title: "Chapter 101", date: "2026-08-08" },
      { id: "ch100", mangaId: "m1", number: 100, title: "Chapter 100", date: "2026-08-01" },
    ]);

    const res = await scanLibraryUpdates({ forceRefresh: true });

    expect(res.totalScanned).toBe(1);
    expect(res.updatesDetected).toBe(1);

    const update = useUpdateStore.getState().getUpdate("srcA", "m1");
    expect(update?.latestChapterId).toBe("ch101");
    expect(update?.seenAt).toBeUndefined();
    expect(useUpdateStore.getState().getUnreadCount()).toBe(1);
  });

  it("respects maxItems and prioritizeRecent", async () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Older Manga",
          lastReadAt: "2026-01-01T00:00:00.000Z",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        "srcA::m2": {
          sourceId: "srcA",
          mangaId: "m2",
          title: "Newer Manga",
          lastReadAt: "2026-08-01T00:00:00.000Z",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch1", mangaId: "m2", number: 1, title: "Chapter 1" },
    ]);

    const res = await scanLibraryUpdates({
      forceRefresh: true,
      maxItems: 1,
      prioritizeRecent: true,
    });

    expect(res.totalScanned).toBe(1);
    expect(apiClient.getChapters).toHaveBeenCalledTimes(1);
    expect(apiClient.getChapters).toHaveBeenCalledWith("srcA", "m2", expect.any(Object));
  });

  it("respects cooldown and skips network calls when scan interval is within cooldown", async () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Solo Leveling",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    // Populate update store with recent check timestamp
    useUpdateStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          mangaTitle: "Solo Leveling",
          latestChapterId: "ch100",
          latestChapterNumber: 100,
          lastCheckedAt: new Date().toISOString(),
        },
      },
    });

    // Second scan without forceRefresh
    const res = await scanLibraryUpdates({ forceRefresh: false, cooldownMs: DEFAULT_COOLDOWN_MS });

    expect(res.skippedCooldown).toBe(1);
    expect(apiClient.getChapters).not.toHaveBeenCalled();
  });

  it("forceRefresh bypasses cooldown", async () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Solo Leveling",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    useUpdateStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          mangaTitle: "Solo Leveling",
          latestChapterId: "ch100",
          latestChapterNumber: 100,
          lastCheckedAt: new Date().toISOString(),
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch100", mangaId: "m1", number: 100, title: "Chapter 100", date: "2026-08-01" },
    ]);

    const res = await scanLibraryUpdates({ forceRefresh: true });

    expect(res.skippedCooldown).toBe(0);
    expect(apiClient.getChapters).toHaveBeenCalledWith("srcA", "m1", expect.any(Object));
  });

  it("isolates source errors without failing whole scan", async () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Manga 1",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        "srcB::m2": {
          sourceId: "srcB",
          mangaId: "m2",
          title: "Manga 2",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    (apiClient.getChapters as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === "srcA") {
        throw new Error("HTTP 500 Source Down");
      }
      return [{ id: "ch10", mangaId: "m2", number: 10, title: "Chapter 10", date: "2026-08-01" }];
    });

    const res = await scanLibraryUpdates({ forceRefresh: true });

    expect(res.totalScanned).toBe(2);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0].sourceId).toBe("srcA");

    // srcB succeeded
    const updateB = useUpdateStore.getState().getUpdate("srcB", "m2");
    expect(updateB?.latestChapterId).toBe("ch10");
  });
});
