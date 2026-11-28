import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { apiClient } from "@/shared/api-client";
import * as registry from "@/shared/sources/source-registry";
import { toast } from "sonner";
import { useAlternateSource } from "../use-alternate-source";

const mockRouter = { replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));

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

  it("keeps the finder open on a rejected attach and closes after an explicit successful retry", () => {
    const onConfirmed = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const candidate = {
      sourceId: "komiku", sourceDisplayName: "Komiku", mangaId: "manga-1-b",
      title: "Test Manga", confidence: "HIGH_CONFIDENCE" as const,
    };
    const { result } = renderHook(() => useAlternateSource({ sourceId: "shinigami", mangaId: "manga-1", onConfirmed }));

    act(() => result.current.setIsOpen(true));
    act(() => result.current.handleConfirm(candidate));
    expect(result.current.isOpen).toBe(true);
    expect(toast.error).toHaveBeenCalledWith("Sumber tidak dapat ditambahkan ke komik ini");

    act(() => result.current.handleConfirm(candidate));
    expect(result.current.isOpen).toBe(false);
    expect(onConfirmed).toHaveBeenCalledWith(candidate);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("excludes newly blocked sources from search, existing results, and navigation", async () => {
    const source = registry.getSourceMetadata("komiku")!;
    const sources = vi.spyOn(registry, "getAllSourceMetadata").mockReturnValue([{
      ...source,
      isEnabled: true,
      isInstalled: true,
      maintenance: undefined,
      status: "online",
      isNsfw: false,
      capabilities: { ...source.capabilities, search: true },
    }]);
    const search = vi.spyOn(apiClient, "search").mockResolvedValue({
      sourceId: "komiku",
      query: "Test Manga",
      page: 1,
      results: [{ id: "manga-1-b", title: "Test Manga", coverUrl: "/cover.png", isNsfw: false }],
      hasNextPage: false,
    });
    try {
      const { result, rerender } = renderHook(
        ({ blockedSourceIds }) => useAlternateSource({ sourceId: "shinigami", mangaId: "manga-1", blockedSourceIds }),
        { initialProps: { blockedSourceIds: new Set<string>() } },
      );
      await act(() => result.current.openAndSearch());
      expect(search).toHaveBeenCalledWith("komiku", "Test Manga", 1);
      expect(result.current.candidates).toHaveLength(1);
      const [candidate] = result.current.candidates;

      rerender({ blockedSourceIds: new Set(["komiku"]) });
      expect(result.current.candidates).toHaveLength(0);
      act(() => result.current.handleConfirm(candidate));
      expect(mockRouter.replace).not.toHaveBeenCalled();
      search.mockClear();
      await act(() => result.current.openAndSearch());
      expect(search).not.toHaveBeenCalled();
    } finally {
      sources.mockRestore();
      search.mockRestore();
    }
  });
});
