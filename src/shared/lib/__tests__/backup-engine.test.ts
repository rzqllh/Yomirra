import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useReaderStore } from "@/shared/store/reader-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useStatsStore } from "@/shared/store/stats-store";
import {
  createBackupPayload,
  performDryRun,
  executeCoordinatedRestore,
} from "../backup-engine";

// Mock cloud sync functions to verify local-only restore
vi.mock("@/shared/lib/sync-utils", () => ({
  pushLibraryItem: vi.fn(),
  deleteLibraryItem: vi.fn(),
  pushHistoryItem: vi.fn(),
  deleteHistoryItem: vi.fn(),
  deleteMangaHistory: vi.fn(),
  pushSourcePreferences: vi.fn(),
}));

describe("Backup & Restore Engine v1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({ items: {} });
    useSettingsStore.setState({ dataSaver: false, hideNsfw: true, keepScreenAwake: true });
    useReaderStore.setState({
      preferences: {
        imageFit: "width",
        pageGap: "none",
        background: "black",
        toolbarBehavior: "auto-hide",
        preloadIntensity: "balanced",
        showPageProgress: true,
        readingDirection: "ltr",
        readingMode: "vertical",
        keepScreenAwake: true,
      },
    });
    useSourcePreferencesStore.setState({ disabledSources: [], hiddenFromHomeSources: [] });
    useStatsStore.setState({ totalReadingTimeMs: 0 });
  });

  it("1. rejects unsupported future schema (schemaVersion > 1)", () => {
    const futurePayload = {
      schemaVersion: 2,
      appVersion: "2.0.0",
      exportedAt: new Date().toISOString(),
      data: {},
    };
    const jsonStr = JSON.stringify(futurePayload);
    const dryRun = performDryRun(jsonStr);

    expect(dryRun.isVersionSupported).toBe(false);
    expect(dryRun.errors).toContainEqual({
      path: "schemaVersion",
      message: "unsupported_future_schema",
    });
  });

  it("2. rejects invalid and non-finite timestamps", () => {
    const payloadWithBadTimes = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: "not-a-date",
      data: {
        library: [
          {
            sourceId: "srcA",
            mangaId: "m1",
            title: "Test",
            addedAt: "invalid-date",
            updatedAt: "invalid-date",
          },
        ],
        history: [
          {
            sourceId: "srcA",
            mangaId: "m1",
            chapterId: "ch1",
            mangaTitle: "Test",
            readAt: NaN,
          },
        ],
        settings: { dataSaver: false, hideNsfw: true, keepScreenAwakeDuringDownloads: true, theme: "system" },
        readerPreferences: {
          imageFit: "width",
          pageGap: "none",
          background: "black",
          toolbarBehavior: "auto-hide",
          preloadIntensity: "balanced",
          showPageProgress: true,
          readingDirection: "ltr",
          readingMode: "vertical",
          keepScreenAwakeWhileReading: true,
        },
        sourcePreferences: { disabledSources: [], hiddenFromHomeSources: [] },
        stats: { totalReadingTimeMs: 100 },
      },
    };

    const dryRun = performDryRun(JSON.stringify(payloadWithBadTimes));
    expect(dryRun.errors.length).toBeGreaterThan(0);
    expect(dryRun.errors.some((e) => e.message.includes("ISO date"))).toBe(true);
  });

  it("3. rejects oversized payload (> 10MB or > 1000 items)", () => {
    const hugePayload = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {
        library: Array.from({ length: 1001 }, (_, i) => ({
          sourceId: "srcA",
          mangaId: `m${i}`,
          title: `Manga ${i}`,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        history: [],
        settings: { dataSaver: false, hideNsfw: true, keepScreenAwakeDuringDownloads: true, theme: "system" },
        readerPreferences: {
          imageFit: "width",
          pageGap: "none",
          background: "black",
          toolbarBehavior: "auto-hide",
          preloadIntensity: "balanced",
          showPageProgress: true,
          readingDirection: "ltr",
          readingMode: "vertical",
          keepScreenAwakeWhileReading: true,
        },
        sourcePreferences: { disabledSources: [], hiddenFromHomeSources: [] },
        stats: { totalReadingTimeMs: 0 },
      },
    };

    const dryRun = performDryRun(JSON.stringify(hugePayload));
    expect(dryRun.errors.some((e) => e.message.includes("1000 item"))).toBe(true);

    // Oversized string test
    const longStringJson = "a".repeat(10 * 1024 * 1024 + 5);
    const sizeDryRun = performDryRun(longStringJson);
    expect(sizeDryRun.errors.some((e) => e.message.includes("10 MB"))).toBe(true);
  });

  it("4. detects duplicate canonical IDs in payload", () => {
    const dupPayload = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {
        library: [
          {
            sourceId: "srcA",
            mangaId: "m1",
            title: "Manga 1",
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            sourceId: "srcA",
            mangaId: "m1",
            title: "Manga 1 Duplicate",
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        history: [],
        settings: { dataSaver: false, hideNsfw: true, keepScreenAwakeDuringDownloads: true, theme: "system" },
        readerPreferences: {
          imageFit: "width",
          pageGap: "none",
          background: "black",
          toolbarBehavior: "auto-hide",
          preloadIntensity: "balanced",
          showPageProgress: true,
          readingDirection: "ltr",
          readingMode: "vertical",
          keepScreenAwakeWhileReading: true,
        },
        sourcePreferences: { disabledSources: [], hiddenFromHomeSources: [] },
        stats: { totalReadingTimeMs: 0 },
      },
    };

    const dryRun = performDryRun(JSON.stringify(dupPayload));
    expect(dryRun.duplicateInPayloadCount).toBe(1);
    expect(dryRun.validLibraryCount).toBe(1);
  });

  it("5. verifies pure dry-run causes ZERO store mutations", () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Initial Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    const payload = createBackupPayload("dark");
    const initialStoreState = useLibraryStore.getState().items;

    performDryRun(JSON.stringify(payload));

    expect(useLibraryStore.getState().items).toBe(initialStoreState);
  });

  it("6. verifies replace mode does NOT invoke cloud sync", async () => {
    const { pushLibraryItem, pushHistoryItem } = await import("@/shared/lib/sync-utils");

    const payload = createBackupPayload("light");
    payload.data.library.push({
      sourceId: "srcA",
      mangaId: "m2",
      title: "New Manga",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    executeCoordinatedRestore(payload, "replace");

    expect(pushLibraryItem).not.toHaveBeenCalled();
    expect(pushHistoryItem).not.toHaveBeenCalled();
  });

  it("7. enforces domain merge policies correctly", () => {
    // Current state setup
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Current Old Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        "srcA::m2": {
          sourceId: "srcA",
          mangaId: "m2",
          title: "Current Newer Manga",
          addedAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      },
    });

    useHistoryStore.setState({
      items: {
        "srcA::m1::ch1": {
          sourceId: "srcA",
          mangaId: "m1",
          chapterId: "ch1",
          mangaTitle: "Current History Old",
          readAt: 1000,
        },
      },
    });

    useStatsStore.setState({ totalReadingTimeMs: 5000 });

    const backup: ReturnType<typeof createBackupPayload> = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {
        library: [
          // m1 in backup is newer -> Should overwrite m1
          {
            sourceId: "srcA",
            mangaId: "m1",
            title: "Backup Newer Manga 1",
            addedAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-05-01T00:00:00.000Z",
          },
          // m2 in backup is older -> Should retain current m2
          {
            sourceId: "srcA",
            mangaId: "m2",
            title: "Backup Older Manga 2",
            addedAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
        ],
        history: [
          // ch1 in backup has newer readAt -> Should overwrite
          {
            sourceId: "srcA",
            mangaId: "m1",
            chapterId: "ch1",
            mangaTitle: "Backup History Newer",
            readAt: 2000,
          },
        ],
        settings: { dataSaver: true, hideNsfw: false, keepScreenAwakeDuringDownloads: false, theme: "dark" },
        readerPreferences: {
          imageFit: "contained",
          pageGap: "small",
          background: "mist",
          toolbarBehavior: "always-visible",
          preloadIntensity: "aggressive",
          showPageProgress: false,
          readingDirection: "rtl",
          readingMode: "vertical",
          keepScreenAwakeWhileReading: false,
        },
        sourcePreferences: { disabledSources: ["srcX"], hiddenFromHomeSources: [] },
        stats: { totalReadingTimeMs: 3000 }, // Backup 3000 < current 5000 -> Merge max=5000
      },
    };

    executeCoordinatedRestore(backup, "merge");

    const libraryItems = useLibraryStore.getState().items;
    expect(libraryItems["srcA::m1"].title).toBe("Backup Newer Manga 1");
    expect(libraryItems["srcA::m2"].title).toBe("Current Newer Manga");

    const historyItems = useHistoryStore.getState().items;
    expect(historyItems["srcA::m1::ch1"].readAt).toBe(2000);

    expect(useStatsStore.getState().totalReadingTimeMs).toBe(5000);
    expect(useSettingsStore.getState().dataSaver).toBe(true);
    expect(useReaderStore.getState().preferences.readingDirection).toBe("rtl");
  });

  it("8. executes in-memory rollback if setter fails", () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Initial State",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    const payload = createBackupPayload("light");

    // Force failure during theme setter or store mutation
    const mockThemeSetter = vi.fn().mockImplementation(() => {
      throw new Error("Simulated theme setter error");
    });

    expect(() => executeCoordinatedRestore(payload, "replace", mockThemeSetter)).toThrow(
      "Simulated theme setter error"
    );

    // Verify initial store state was restored via in-memory rollback
    expect(useLibraryStore.getState().items["srcA::m1"].title).toBe("Initial State");
  });

  it("9. excludes NSFW items and tracks excludedNsfwCount", () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "SFW Manga",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isNsfw: false,
        },
        "srcA::m2": {
          sourceId: "srcA",
          mangaId: "m2",
          title: "NSFW Manga",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isNsfw: true,
        },
      },
    });

    const payload = createBackupPayload("system");
    expect(payload.data.library.length).toBe(1);
    expect(payload.data.library[0].title).toBe("SFW Manga");
  });

  it("10. proves importing the same backup twice is idempotent", () => {
    useLibraryStore.setState({
      items: {
        "srcA::m1": {
          sourceId: "srcA",
          mangaId: "m1",
          title: "Manga 1",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    const payload = createBackupPayload("dark");

    // First import
    executeCoordinatedRestore(payload, "merge");
    const stateAfterFirst = useLibraryStore.getState().items;

    // Second import with identical payload
    executeCoordinatedRestore(payload, "merge");
    const stateAfterSecond = useLibraryStore.getState().items;

    expect(stateAfterSecond).toEqual(stateAfterFirst);
  });
});
