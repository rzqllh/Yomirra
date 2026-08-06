import { describe, it, expect, beforeEach } from "vitest";
import { useUpdateStore, getUpdateKey } from "../update-store";
import { useSettingsStore } from "../settings-store";

describe("UpdateStore (Slice 1.1)", () => {
  beforeEach(() => {
    useUpdateStore.setState({ items: {} });
    useSettingsStore.setState({
      notifyForAllLibraryItems: true,
      mutedMangaKeys: []
    });
  });

  it("keys records by sourceId::mangaId", () => {
    const key = getUpdateKey("srcA", "m1");
    expect(key).toBe("srcA::m1");
  });

  it("upserts new update record and calculates unread count", () => {
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
      latestChapterNumber: 1,
      latestChapterTitle: "Chapter 1",
    });

    const item = useUpdateStore.getState().getUpdate("srcA", "m1");
    expect(item).toBeDefined();
    expect(item?.mangaTitle).toBe("Manga 1");
    expect(item?.latestChapterId).toBe("ch1");
    expect(item?.detectedAt).toBeDefined();
    expect(useUpdateStore.getState().getUnreadCount()).toBe(1);
  });

  it("does not overwrite detectedAt or duplicate update when re-scanning same chapter", () => {
    const initialDetectedAt = "2026-08-01T10:00:00.000Z";

    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
      latestChapterNumber: 1,
      detectedAt: initialDetectedAt,
    });

    // Re-scan same chapter 1
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
      latestChapterNumber: 1,
      lastCheckedAt: "2026-08-06T10:00:00.000Z",
    });

    const item = useUpdateStore.getState().getUpdate("srcA", "m1");
    expect(item?.detectedAt).toBe(initialDetectedAt);
    expect(item?.lastCheckedAt).toBe("2026-08-06T10:00:00.000Z");
    expect(Object.keys(useUpdateStore.getState().items).length).toBe(1);
  });

  it("detects new chapter and updates detectedAt while clearing seenAt", () => {
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
      latestChapterNumber: 1,
    });

    useUpdateStore.getState().markAsSeen("srcA", "m1");
    expect(useUpdateStore.getState().getUnreadCount()).toBe(0);

    // New chapter 2 released
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch2",
      latestChapterNumber: 2,
    });

    const item = useUpdateStore.getState().getUpdate("srcA", "m1");
    expect(item?.latestChapterId).toBe("ch2");
    expect(item?.seenAt).toBeUndefined();
    expect(useUpdateStore.getState().getUnreadCount()).toBe(1);
  });

  it("marks a single update as seen", () => {
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
    });
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m2",
      mangaTitle: "Manga 2",
      latestChapterId: "ch1",
    });

    expect(useUpdateStore.getState().getUnreadCount()).toBe(2);

    useUpdateStore.getState().markAsSeen("srcA", "m1");

    expect(useUpdateStore.getState().getUnreadCount()).toBe(1);
    expect(useUpdateStore.getState().getUpdate("srcA", "m1")?.seenAt).toBeDefined();
    expect(useUpdateStore.getState().getUpdate("srcA", "m2")?.seenAt).toBeUndefined();
  });

  it("marks all updates as seen deterministically", () => {
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
    });
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcB",
      mangaId: "m2",
      mangaTitle: "Manga 2",
      latestChapterId: "ch5",
    });

    expect(useUpdateStore.getState().getUnreadCount()).toBe(2);

    useUpdateStore.getState().markAllAsSeen();

    expect(useUpdateStore.getState().getUnreadCount()).toBe(0);
    expect(useUpdateStore.getState().getUpdate("srcA", "m1")?.seenAt).toBeDefined();
    expect(useUpdateStore.getState().getUpdate("srcB", "m2")?.seenAt).toBeDefined();
  });

  it("removes and clears update records cleanly", () => {
    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m1",
      mangaTitle: "Manga 1",
      latestChapterId: "ch1",
    });

    useUpdateStore.getState().removeUpdate("srcA", "m1");
    expect(useUpdateStore.getState().getUpdate("srcA", "m1")).toBeUndefined();

    useUpdateStore.getState().upsertUpdate({
      sourceId: "srcA",
      mangaId: "m2",
      mangaTitle: "Manga 2",
      latestChapterId: "ch2",
    });
    useUpdateStore.getState().clearUpdates();
    expect(Object.keys(useUpdateStore.getState().items).length).toBe(0);
  });

  describe("Notification Preferences (Slice 1.4)", () => {
    it("returns 0 unread if notifyForAllLibraryItems is false", () => {
      useUpdateStore.getState().upsertUpdate({
        sourceId: "srcA",
        mangaId: "m1",
        mangaTitle: "Manga 1",
        latestChapterId: "ch1",
      });

      expect(useUpdateStore.getState().getUnreadCount()).toBe(1);

      useSettingsStore.setState({ notifyForAllLibraryItems: false });
      expect(useUpdateStore.getState().getUnreadCount()).toBe(0);
    });

    it("does not count muted manga as unread", () => {
      useUpdateStore.getState().upsertUpdate({
        sourceId: "srcA",
        mangaId: "m1",
        mangaTitle: "Manga 1",
        latestChapterId: "ch1",
      });

      expect(useUpdateStore.getState().getUnreadCount()).toBe(1);

      useSettingsStore.setState({ mutedMangaKeys: ["srcA::m1"] });
      expect(useUpdateStore.getState().getUnreadCount()).toBe(0);

      useSettingsStore.setState({ mutedMangaKeys: [] });
      expect(useUpdateStore.getState().getUnreadCount()).toBe(1);
    });

    it("updates page list still contains muted manga", () => {
      useUpdateStore.getState().upsertUpdate({
        sourceId: "srcA",
        mangaId: "m1",
        mangaTitle: "Manga 1",
        latestChapterId: "ch1",
      });

      useSettingsStore.setState({ mutedMangaKeys: ["srcA::m1"] });

      // Still exists in store items
      const item = useUpdateStore.getState().getUpdate("srcA", "m1");
      expect(item).toBeDefined();
    });
  });
});
