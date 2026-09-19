import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { useUpdateStore } from "@/shared/store/update-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourceHealthStore } from "@/shared/store/source-health-store";
import { scanLibraryUpdates } from "../update-checker";
import { apiClient } from "@/shared/api-client";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getChapters: vi.fn(),
    getDetail: vi.fn(),
  },
}));

describe("Phase 8 — Source-Agnostic Update Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
    useUpdateStore.setState({ items: {} });
    useSettingsStore.setState({
      perTitleSourcePreferences: {},
      routingMode: "PREFERRED",
      globalSourceOrder: [],
      preferredLanguages: ["id", "en"],
    });
    useSourceHealthStore.setState({ healthBySource: {} });
  });

  it("1. healthy primary detects update normally", async () => {
    useLibraryStore.setState({
      items: {
        "title-1": {
          id: "title-1",
          sourceId: "mangadex",
          mangaId: "solo-leveling",
          title: "Solo Leveling",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch-100", number: 100, title: "Chapter 100" },
    ]);

    const res = await scanLibraryUpdates({ forceRefresh: true });
    expect(res.totalScanned).toBe(1);

    const update = useUpdateStore.getState().items["title-1"];
    expect(update).toBeDefined();
    expect(update.latestChapterId).toBe("ch-100");
    expect(update.latestChapterNumber).toBe(100);
    expect(update.detectedSourceId).toBe("mangadex");
    expect(update.isAlternateSource).toBe(false);
  });

  it("2. broken primary uses confirmed alternate and isolates failure", async () => {
    useLibraryStore.setState({
      items: {
        "title-2": {
          id: "title-2",
          sourceId: "broken-src",
          mangaId: "manga-2",
          title: "Omniscient Reader",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "healthy-alt",
              mangaId: "alt-manga-2",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // Primary throws error; alternate succeeds
    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "broken-src") {
        return Promise.reject(new Error("503 Service Unavailable"));
      }
      if (sourceId === "healthy-alt") {
        return Promise.resolve([
          { id: "alt-ch-55", number: 55, title: "Chapter 55" },
        ]);
      }
      return Promise.resolve([]);
    });

    const res = await scanLibraryUpdates({ forceRefresh: true });
    expect(res.totalScanned).toBe(1);
    // Failure was isolated because alternate succeeded!
    expect(res.errors.length).toBe(0);

    const update = useUpdateStore.getState().items["title-2"];
    expect(update).toBeDefined();
    expect(update.latestChapterId).toBe("alt-ch-55");
    expect(update.latestChapterNumber).toBe(55);
    expect(update.detectedSourceId).toBe("healthy-alt");
    expect(update.isAlternateSource).toBe(true);
  });

  it("3. alternate update check DOES NOT permanently relink the library title", async () => {
    useLibraryStore.setState({
      items: {
        "title-3": {
          id: "title-3",
          sourceId: "primary-source",
          mangaId: "slug-orig",
          title: "Tower of God",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "alternate-source",
              mangaId: "slug-alt",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "alt-ch-1", number: 1, title: "Chapter 1" },
    ]);

    await scanLibraryUpdates({ forceRefresh: true });

    // Verify invariant: Library item primary source is UNTOUCHED
    const libItem = useLibraryStore.getState().items["title-3"];
    expect(libItem.sourceId).toBe("primary-source");
    expect(libItem.mangaId).toBe("slug-orig");
  });

  it("4. deduplicates identical logical chapter from two sources", async () => {
    useLibraryStore.setState({
      items: {
        "title-4": {
          id: "title-4",
          sourceId: "src-1",
          mangaId: "m-1",
          title: "Return of the Mount Hua Sect",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "src-2",
              mangaId: "m-2",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // Both sources report Chapter 80
    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "src-1") {
        return Promise.resolve([
          { id: "src1-ch80", number: 80, title: "Chapter 80" },
        ]);
      }
      if (sourceId === "src-2") {
        return Promise.resolve([
          { id: "src2-ch80", number: 80, title: "Ch. 80" },
        ]);
      }
      return Promise.resolve([]);
    });

    await scanLibraryUpdates({ forceRefresh: true });

    // Only one update record exists for the title
    const updates = Object.values(useUpdateStore.getState().items);
    const titleUpdates = updates.filter((u) => u.savedTitleId === "title-4");
    expect(titleUpdates.length).toBe(1);
    expect(titleUpdates[0].latestChapterNumber).toBe(80);
    // Prefers primary source if numbers are identical
    expect(titleUpdates[0].detectedSourceId).toBe("src-1");
  });

  it("5. normalizes decimal/part chapters accurately (e.g. 105.5)", async () => {
    useLibraryStore.setState({
      items: {
        "title-5": {
          id: "title-5",
          sourceId: "src-decimal",
          mangaId: "m-decimal",
          title: "Decimal Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch-105-5", number: 0, title: "Chapter 105.5 Special Edition" },
      { id: "ch-105", number: 105, title: "Chapter 105" },
    ]);

    await scanLibraryUpdates({ forceRefresh: true });

    const update = useUpdateStore.getState().items["title-5"];
    expect(update.latestChapterNumber).toBe(105.5);
    expect(update.latestChapterId).toBe("ch-105-5");
  });

  it("6. honors explicit per-title preference over default primary", async () => {
    useLibraryStore.setState({
      items: {
        "title-6": {
          id: "title-6",
          sourceId: "source-default",
          mangaId: "manga-default",
          title: "Pref Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "source-preferred",
              mangaId: "manga-preferred",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // User explicitly chose source-preferred
    useSettingsStore.setState({
      perTitleSourcePreferences: {
        "title-6": "source-preferred",
      },
    });

    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "source-preferred") {
        return Promise.resolve([
          { id: "pref-ch-200", number: 200, title: "Chapter 200" },
        ]);
      }
      return Promise.resolve([
        { id: "def-ch-190", number: 190, title: "Chapter 190" },
      ]);
    });

    await scanLibraryUpdates({ forceRefresh: true });

    const update = useUpdateStore.getState().items["title-6"];
    expect(update.detectedSourceId).toBe("source-preferred");
    expect(update.latestChapterNumber).toBe(200);
  });

  it("7. deprioritizes known degraded/offline sources", async () => {
    useLibraryStore.setState({
      items: {
        "title-7": {
          id: "title-7",
          sourceId: "broken-primary",
          mangaId: "manga-7",
          title: "Health Aware Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "healthy-alt",
              mangaId: "manga-7-alt",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // broken-primary marked offline in health store
    useSourceHealthStore.setState({
      healthBySource: {
        "broken-primary": {
          status: "offline",
          latencyMs: 10000,
          lastSuccessAt: 0,
          consecutiveFailures: 5,
        },
      },
    });

    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "healthy-alt") {
        return Promise.resolve([
          { id: "healthy-ch-1", number: 1, title: "Chapter 1" },
        ]);
      }
      return Promise.reject(new Error("Down"));
    });

    const res = await scanLibraryUpdates({ forceRefresh: true });
    expect(res.totalScanned).toBe(1);
    expect(res.errors.length).toBe(0);

    const update = useUpdateStore.getState().items["title-7"];
    expect(update.detectedSourceId).toBe("healthy-alt");
    expect(update.latestChapterNumber).toBe(1);
  });
});
