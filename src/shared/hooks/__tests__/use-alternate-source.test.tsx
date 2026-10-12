import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useAlternateSource } from "../use-alternate-source";
import { executeSourceMigration } from "@/shared/lib/source-fallback";

const mockRouter = { replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/shared/lib/source-fallback", () => ({
  executeSourceMigration: vi.fn(),
}));

describe("useAlternateSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({
      items: {
        "source-a::manga-1::ch-1": {
          sourceId: "source-a",
          mangaId: "manga-1",
          chapterId: "ch-1",
          mangaTitle: "Test Manga",
          chapterTitle: "Chapter 1",
          readAt: 1000,
        },
      },
    });
  });

  it("updates handleConfirm with fresh historyItem when history store updates", async () => {
    const { result, rerender } = renderHook(() =>
      useAlternateSource({
        sourceId: "source-a",
        mangaId: "manga-1",
        currentChapterId: "ch-1",
      })
    );

    const initialCallback = result.current.handleConfirm;

    // Simulate progress update while modal was open or mounted (same chapter, higher page/readAt)
    act(() => {
      useHistoryStore.setState({
        items: {
          "source-a::manga-1::ch-1": {
            sourceId: "source-a",
            mangaId: "manga-1",
            chapterId: "ch-1",
            mangaTitle: "Test Manga",
            chapterTitle: "Chapter 1",
            pageIndex: 15,
            readAt: 2000,
          },
        },
      });
    });

    rerender();

    // Callback identity must be updated when historyItem updates
    expect(result.current.handleConfirm).not.toBe(initialCallback);

    // Calling handleConfirm must pass the latest historyItem (pageIndex 15, not 0)
    await act(async () => {
      await result.current.handleConfirm({
        sourceId: "source-b",
        sourceDisplayName: "Source B",
        mangaId: "manga-1-b",
        title: "Test Manga",
        confidence: "HIGH_CONFIDENCE",
      });
    });

    expect(executeSourceMigration).toHaveBeenCalledWith(
      expect.objectContaining({
        historyItem: expect.objectContaining({
          pageIndex: 15,
        }),
      })
    );
  });
});
