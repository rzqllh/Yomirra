import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBookmarkReading } from "../use-bookmark-reading";
import { useHistoryStore } from "@/shared/store/history-store";

vi.mock("@/shared/hooks/use-mounted", () => ({
  useMounted: () => true,
}));

vi.mock("@/shared/hooks/use-nsfw-source-ids", () => ({
  useNsfwSourceIds: () => ({ status: "KNOWN", ids: new Set() }),
}));

vi.mock("@/shared/store/source-preferences-store", () => ({
  useSourcePreferencesStore: () => ({
    isSourceDisabled: () => false,
  }),
}));

describe("useBookmarkReading - Chapter Progress Alignment", () => {
  beforeEach(() => {
    useHistoryStore.setState({ items: {} });
  });

  it("sorts chapters descending so that the most recent chapter is chapters[0]", () => {
    // Simulate reading Chapter 4 first (timestamp 1000)
    // and Chapter 43 later (timestamp 5000)
    useHistoryStore.setState({
      items: {
        "item-older": {
          sourceId: "shinigami",
          mangaId: "my-system-is-very-serious",
          chapterId: "ch-4",
          chapterTitle: "Chapter 4",
          chapterNumber: 4,
          mangaTitle: "My System Is Very Serious",
          coverUrl: "https://example.com/cover.jpg",
          pageIndex: 1,
          totalPages: 20,
          readAt: 1000,
        },
        "item-newer": {
          sourceId: "shinigami",
          mangaId: "my-system-is-very-serious",
          chapterId: "ch-43",
          chapterTitle: "Chapter 43",
          chapterNumber: 43,
          mangaTitle: "My System Is Very Serious",
          coverUrl: "https://example.com/cover.jpg",
          pageIndex: 5,
          totalPages: 20,
          readAt: 5000,
        },
      },
    });

    const { result } = renderHook(() => useBookmarkReading());

    expect(result.current.groupedHistory.length).toBe(1);
    const mangaGroup = result.current.groupedHistory[0];
    expect(mangaGroup.mangaTitle).toBe("My System Is Very Serious");
    expect(mangaGroup.chapters.length).toBe(2);
    // The first chapter must be the latest chapter read (Chapter 43)
    expect(mangaGroup.chapters[0].chapterNumber).toBe(43);
    expect(mangaGroup.chapters[0].chapterTitle).toBe("Chapter 43");
  });

  it("handles string ISO dates and legacy timestamps without NaN sorting breakdown", () => {
    useHistoryStore.setState({
      items: {
        "item-iso-older": {
          sourceId: "shinigami",
          mangaId: "sword-hound",
          chapterId: "ch-146",
          chapterTitle: "Chapter 146",
          chapterNumber: 146,
          mangaTitle: "Revenge Of The Iron-Blooded Sword Hound",
          coverUrl: "https://example.com/cover2.jpg",
          pageIndex: 1,
          totalPages: 30,
          readAt: "2026-08-01T00:00:00.000Z" as any,
        },
        "item-iso-newer": {
          sourceId: "shinigami",
          mangaId: "sword-hound",
          chapterId: "ch-180",
          chapterTitle: "Chapter 180",
          chapterNumber: 180,
          mangaTitle: "Revenge Of The Iron-Blooded Sword Hound",
          coverUrl: "https://example.com/cover2.jpg",
          pageIndex: 10,
          totalPages: 30,
          readAt: "2026-09-15T00:00:00.000Z" as any,
        },
      },
    });

    const { result } = renderHook(() => useBookmarkReading());

    expect(result.current.groupedHistory.length).toBe(1);
    const mangaGroup = result.current.groupedHistory[0];
    expect(mangaGroup.chapters[0].chapterNumber).toBe(180);
    expect(mangaGroup.chapters[0].chapterTitle).toBe("Chapter 180");
  });

  it("filters out manga marked as 'completed' in collection reading status", async () => {
    const { useCollectionStore } = await import("@/shared/store/collection-store");
    useCollectionStore.setState({
      readingStatusByManga: {
        "shinigami::sword-hound": "completed",
      },
    });

    useHistoryStore.setState({
      items: {
        "item-1": {
          sourceId: "shinigami",
          mangaId: "sword-hound",
          chapterId: "ch-180",
          chapterTitle: "Chapter 180",
          mangaTitle: "Revenge Of The Iron-Blooded Sword Hound",
          readAt: 5000,
        },
        "item-2": {
          sourceId: "shinigami",
          mangaId: "active-manga",
          chapterId: "ch-1",
          chapterTitle: "Chapter 1",
          mangaTitle: "Active Manga",
          readAt: 4000,
        },
      },
    });

    const { result } = renderHook(() => useBookmarkReading());
    expect(result.current.groupedHistory.length).toBe(1);
    expect(result.current.groupedHistory[0].mangaId).toBe("active-manga");
  });
});
