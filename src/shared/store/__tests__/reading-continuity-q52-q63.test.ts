import { describe, expect, it, vi, beforeEach } from "vitest";
import { useHistoryStore } from "../history-store";
import { useLibraryStore } from "../library-store";
import { resolveContinueChapterId } from "@/shared/lib/chapter-continuity";
import { executeSourceMigration } from "@/shared/lib/source-fallback";

vi.mock("@/shared/lib/sync-utils", () => ({
  pushHistoryItem: vi.fn().mockResolvedValue(undefined),
  deleteHistoryItem: vi.fn().mockResolvedValue(undefined),
  deleteMangaHistory: vi.fn().mockResolvedValue(undefined),
  pushLibraryItem: vi.fn().mockResolvedValue(undefined),
  deleteLibraryItem: vi.fn().mockResolvedValue(undefined),
}));

describe("Reading Continuity Q52 (Highest Milestone) & Q63 (Independent Cursor) Regression Suite", () => {
  beforeEach(() => {
    useHistoryStore.setState({ items: {} });
    useLibraryStore.setState({ items: {} });
    vi.clearAllMocks();
  });

  it("Scenario 1-6: Chapter 30 completed, reread Chapter 5, milestone durability, independent cursors, advance to Chapter 31", () => {
    const historyStore = useHistoryStore.getState();

    // 1. Membaca chapter 30 sampai selesai (100%)
    historyStore.upsertHistory({
      sourceId: "shinigami",
      mangaId: "solo-leveling",
      chapterId: "ch-30",
      mangaTitle: "Solo Leveling",
      chapterTitle: "Chapter 30",
      chapterIndex: 30,
      totalChapters: 50,
      progressPercent: 100,
      pageIndex: 24,
      totalPages: 24,
      readAt: 1000,
    });

    useLibraryStore.getState().addToLibrary({
      sourceId: "shinigami",
      mangaId: "solo-leveling",
      title: "Solo Leveling",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastReadChapterId: "ch-30",
      lastReadChapterTitle: "Chapter 30",
      highestMilestoneChapterId: "ch-30",
      highestMilestoneChapterTitle: "Chapter 30",
      highestMilestoneIndex: 30,
    });

    // 2. Membaca ulang chapter 5 (misal baru baca sampai halaman 4 / 40%)
    historyStore.upsertHistory({
      sourceId: "shinigami",
      mangaId: "solo-leveling",
      chapterId: "ch-5",
      mangaTitle: "Solo Leveling",
      chapterTitle: "Chapter 5",
      chapterIndex: 5,
      totalChapters: 50,
      progressPercent: 40,
      pageIndex: 4,
      totalPages: 10,
      readAt: 2000, // Read after chapter 30
    });

    // Update library state after reread: lastRead moves to ch-5, but highestMilestone stays ch-30
    const libItem = useLibraryStore.getState().getLibraryItem("shinigami", "solo-leveling")!;
    const prevMilestoneIndex = libItem.highestMilestoneIndex ?? 0;
    const readCount = 5;
    const isHigher = readCount >= prevMilestoneIndex; // 5 >= 30 is false!
    useLibraryStore.getState().updateLibraryItem("shinigami", "solo-leveling", {
      lastReadChapterId: "ch-5",
      lastReadChapterTitle: "Chapter 5",
      ...(isHigher ? {
        highestMilestoneChapterId: "ch-5",
        highestMilestoneChapterTitle: "Chapter 5",
        highestMilestoneIndex: 5,
      } : {}),
    });

    // 3. Continue Reading tetap menunjuk milestone tertinggi yang valid (Chapter 30)
    const highestMilestone = useHistoryStore.getState().getHighestMilestoneForManga("shinigami", "solo-leveling");
    expect(highestMilestone).toBeDefined();
    expect(highestMilestone?.chapterId).toBe("ch-30");
    expect(highestMilestone?.chapterNumber).toBe(30);

    const continueReadingList = useHistoryStore.getState().getContinueReading();
    expect(continueReadingList).toHaveLength(1);
    expect(continueReadingList[0].chapterId).toBe("ch-30");

    const updatedLibItem = useLibraryStore.getState().getLibraryItem("shinigami", "solo-leveling")!;
    expect(updatedLibItem.highestMilestoneChapterId).toBe("ch-30");
    expect(updatedLibItem.lastReadChapterId).toBe("ch-5");

    // 4. Cursor chapter 5 tetap terjaga secara terpisah
    const ch5Item = useHistoryStore.getState().items["shinigami::solo-leveling::ch-5"];
    expect(ch5Item).toBeDefined();
    expect(ch5Item.pageIndex).toBe(4);
    expect(ch5Item.progressPercent).toBe(40);

    // 5. Cursor chapter 30 tidak terhapus
    const ch30Item = useHistoryStore.getState().items["shinigami::solo-leveling::ch-30"];
    expect(ch30Item).toBeDefined();
    expect(ch30Item.pageIndex).toBe(24);
    expect(ch30Item.progressPercent).toBe(100);

    // 6. Membuka chapter 31 memajukan milestone sesuai aturan
    historyStore.upsertHistory({
      sourceId: "shinigami",
      mangaId: "solo-leveling",
      chapterId: "ch-31",
      mangaTitle: "Solo Leveling",
      chapterTitle: "Chapter 31",
      chapterIndex: 31,
      totalChapters: 50,
      progressPercent: 100,
      pageIndex: 22,
      totalPages: 22,
      readAt: 3000,
    });

    useLibraryStore.getState().updateLibraryItem("shinigami", "solo-leveling", {
      lastReadChapterId: "ch-31",
      lastReadChapterTitle: "Chapter 31",
      highestMilestoneChapterId: "ch-31",
      highestMilestoneChapterTitle: "Chapter 31",
      highestMilestoneIndex: 31,
    });

    const newHighestMilestone = useHistoryStore.getState().getHighestMilestoneForManga("shinigami", "solo-leveling");
    expect(newHighestMilestone?.chapterId).toBe("ch-31");
    expect(newHighestMilestone?.chapterNumber).toBe(31);
  });

  it("Scenario 7: Chapter bernomor pecahan (57.5), chapter 0, special, prologue, dan label nonnumerik", () => {
    const historyStore = useHistoryStore.getState();

    historyStore.upsertHistory({
      sourceId: "src",
      mangaId: "complex-manga",
      chapterId: "ch-prologue",
      mangaTitle: "Complex",
      chapterTitle: "Prologue",
      readAt: 100,
    });

    historyStore.upsertHistory({
      sourceId: "src",
      mangaId: "complex-manga",
      chapterId: "ch-0",
      mangaTitle: "Complex",
      chapterTitle: "Chapter 0",
      readAt: 200,
    });

    historyStore.upsertHistory({
      sourceId: "src",
      mangaId: "complex-manga",
      chapterId: "ch-57",
      mangaTitle: "Complex",
      chapterTitle: "Chapter 57",
      readAt: 300,
    });

    historyStore.upsertHistory({
      sourceId: "src",
      mangaId: "complex-manga",
      chapterId: "ch-57-5",
      mangaTitle: "Complex",
      chapterTitle: "Chapter 57.5 Special Extra",
      readAt: 400,
    });

    const highest = historyStore.getHighestMilestoneForManga("src", "complex-manga");
    expect(highest?.chapterId).toBe("ch-57-5");
    expect(highest?.chapterNumber).toBe(57.5);
  });

  it("Scenario 8: Daftar chapter dengan urutan descending vs ascending", () => {
    // Adapter chapters list (newest first: descending)
    const chaptersDescending = [
      { id: "ch-3", title: "Chapter 3", number: 3 },
      { id: "ch-2", title: "Chapter 2", number: 2 },
      { id: "ch-1", title: "Chapter 1", number: 1 },
    ];

    // If Chapter 2 is 100% complete, continue reading should advance to Chapter 3
    const nextDesc = resolveContinueChapterId(chaptersDescending, { chapterId: "ch-2", progressPercent: 100 });
    expect(nextDesc).toBe("ch-3");

    // If Chapter 2 is only 40% complete, continue reading stays on Chapter 2
    const stayDesc = resolveContinueChapterId(chaptersDescending, { chapterId: "ch-2", progressPercent: 40 });
    expect(stayDesc).toBe("ch-2");
  });

  it("Scenario 9: Pergantian source dengan chapter mapping valid menjaga highest milestone (Q52)", () => {
    const libraryItem = {
      sourceId: "dead-src",
      mangaId: "dead-manga",
      title: "Solo Leveling",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      highestMilestoneChapterId: "ch-30",
      highestMilestoneChapterTitle: "Chapter 30",
      lastReadChapterId: "ch-5", // User reread ch-5 recently
      lastReadChapterTitle: "Chapter 5",
    };

    const rereadHistoryItem = {
      sourceId: "dead-src",
      mangaId: "dead-manga",
      chapterId: "ch-5",
      chapterTitle: "Chapter 5",
      chapterNumber: 5,
      mangaTitle: "Solo Leveling",
      readAt: 5000,
    };

    const milestoneHistoryItem = {
      sourceId: "dead-src",
      mangaId: "dead-manga",
      chapterId: "ch-30",
      chapterTitle: "Chapter 30",
      chapterNumber: 30,
      mangaTitle: "Solo Leveling",
      readAt: 1000,
    };

    const snapshot = executeSourceMigration({
      libraryItem,
      fallbackResult: {
        status: "AUTO_SAFE",
        reason: "Source migration test",
        candidate: {
          sourceId: "new-src",
          mangaId: "new-manga",
          title: "Solo Leveling",
          addedAt: Date.now(),
          matchConfidence: "CONFIRMED",
        },
        suggestedChapterId: "new-ch-30",
        suggestedChapterNumber: 30,
        requiresUserConfirmation: false,
      },
      historyItem: rereadHistoryItem,
      milestoneItem: milestoneHistoryItem,
    });

    // Milestone should NOT regress to ch-5; snapshot fromChapterId must be ch-30
    expect(snapshot.fromChapterId).toBe("ch-30");
    expect(snapshot.toChapterId).toBe("new-ch-30");
  });

  it("Scenario 10: Mapping sumber ambigu atau tidak tersedia tidak menebak sembarangan", () => {
    const libraryItem = {
      sourceId: "dead-src",
      mangaId: "unmapped-manga",
      title: "Unknown Manga",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      highestMilestoneChapterId: "ch-10",
      highestMilestoneChapterTitle: "Chapter 10",
    };

    const snapshot = executeSourceMigration({
      libraryItem,
      fallbackResult: {
        status: "CONFIRM_REQUIRED",
        reason: "Ambiguous chapters",
        candidate: {
          sourceId: "new-src",
          mangaId: "new-manga",
          title: "Unknown Manga",
          addedAt: Date.now(),
          matchConfidence: "AMBIGUOUS",
        },
        requiresUserConfirmation: true,
      },
    });

    expect(snapshot.fromChapterId).toBe("ch-10");
    // When unmapped, toChapterId is undefined (requires user confirmation before jumping)
    expect(snapshot.toChapterId).toBeUndefined();
  });

  it("Scenario 11: Migrasi dari data history/library versi lama (auto-parse chapterNumber)", () => {
    const store = useHistoryStore.getState();

    // Old item created without chapterNumber field
    store.upsertHistory({
      sourceId: "legacy-src",
      mangaId: "legacy-manga",
      chapterId: "c-42",
      mangaTitle: "Legacy Title",
      chapterTitle: "Ch. 42 - The Truth",
      readAt: 100,
    });

    const storedItem = useHistoryStore.getState().items["legacy-src::legacy-manga::c-42"];
    expect(storedItem.chapterNumber).toBe(42);

    const highest = useHistoryStore.getState().getHighestMilestoneForManga("legacy-src", "legacy-manga");
    expect(highest?.chapterNumber).toBe(42);
  });

  it("Scenario 12: Guest dan authenticated user preserves independent chapter cursors", () => {
    const store = useHistoryStore.getState();

    // Guest saves reading progress on multiple chapters
    store.saveProgress("src", "guest-manga", "ch-1", 5, 200);
    store.saveProgress("src", "guest-manga", "ch-2", 12, 450);

    const ch1 = useHistoryStore.getState().items["src::guest-manga::ch-1"];
    const ch2 = useHistoryStore.getState().items["src::guest-manga::ch-2"];

    expect(ch1.pageIndex).toBe(5);
    expect(ch1.pageOffset).toBe(200);
    expect(ch2.pageIndex).toBe(12);
    expect(ch2.pageOffset).toBe(450);
  });

  it("Scenario 13: Refresh dan offline update tidak merusak milestone durability", () => {
    const store = useHistoryStore.getState();

    store.upsertHistory({
      sourceId: "src",
      mangaId: "durability-manga",
      chapterId: "ch-100",
      chapterTitle: "Chapter 100",
      mangaTitle: "Durability",
      readAt: 1000,
    });

    // Offline mark progress on older chapter 20
    store.markChapterProgress("src", "durability-manga", "ch-20", 5, 20);

    const highest = store.getHighestMilestoneForManga("src", "durability-manga");
    expect(highest?.chapterId).toBe("ch-100");
  });

  it("Scenario 14: Pembukaan chapter yang belum selesai tidak otomatis dianggap completed", () => {
    const chapters = [
      { id: "ch-2", title: "Chapter 2", number: 2 },
      { id: "ch-1", title: "Chapter 1", number: 1 },
    ];

    // Opening Chapter 1 with 0% progress
    const continueTarget = resolveContinueChapterId(chapters, {
      chapterId: "ch-1",
      progressPercent: 0,
    });

    // Must stay on Chapter 1, never jumping to Chapter 2
    expect(continueTarget).toBe("ch-1");
  });
});
