import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useAlternateSource } from "../use-alternate-source";

const mockRouter = { replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

describe("useAlternateSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSourcePreferencesStore.setState({ disabledSources: [] });
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({ items: {
      "shinigami::manga-1::ch-1": {
        sourceId: "shinigami", mangaId: "manga-1", chapterId: "ch-1",
        mangaTitle: "Test Manga", chapterTitle: "Chapter 1", readAt: 1000, pageIndex: 15,
      },
    } });
  });

  it("opens a selected provider without migrating progress or changing the library", () => {
    const { result } = renderHook(() => useAlternateSource({ sourceId: "shinigami", mangaId: "manga-1" }));
    const history = useHistoryStore.getState().items;
    const library = useLibraryStore.getState().items;
    act(() => result.current.handleConfirm({
      sourceId: "komiku", sourceDisplayName: "Komiku", mangaId: "manga-1-b",
      title: "Test Manga", confidence: "HIGH_CONFIDENCE",
    }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/manga/komiku/manga-1-b");
    expect(useHistoryStore.getState().items).toEqual(history);
    expect(useLibraryStore.getState().items).toEqual(library);
  });
});
