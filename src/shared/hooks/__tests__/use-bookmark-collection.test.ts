import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookmarkCollection } from "../use-bookmark-collection";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useCollectionStore } from "@/shared/store/collection-store";

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

describe("useBookmarkCollection smart filters", () => {
  beforeEach(() => {
    useLibraryStore.setState({
      items: {
        reading: {
          id: "reading",
          sourceId: "source-a",
          mangaId: "reading",
          title: "Reading",
          format: "Manhwa",
          addedAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-29T00:00:00.000Z",
        },
        unread: {
          id: "unread",
          sourceId: "source-a",
          mangaId: "unread",
          title: "Unread",
          format: "Manga",
          addedAt: "2026-09-28T00:00:00.000Z",
          updatedAt: "2026-09-28T00:00:00.000Z",
        },
      },
    });
    useHistoryStore.setState({
      items: {
        "reading-history": {
          sourceId: "source-a",
          mangaId: "reading",
          chapterId: "chapter-2",
          mangaTitle: "Reading",
          readAt: Date.UTC(2026, 8, 29, 7),
          seriesProgressPercent: 40,
        },
      },
    });
    useCollectionStore.setState({
      collections: [],
      membershipsByManga: {},
    });
  });

  it("exposes derived smart collections and filters the bookmark list", () => {
    const { result } = renderHook(() => useBookmarkCollection());

    expect(
      result.current.smartCollections
        .find((collection) => collection.id === "continue-reading")
        ?.items.map((item) => item.id)
    ).toEqual(["reading"]);
    expect(result.current.totalLibraryItemsCount).toBe(2);

    act(() => {
      result.current.setSelectedSmartCollectionId("continue-reading");
    });

    expect(result.current.selectedSmartCollectionId).toBe("continue-reading");
    expect(result.current.selectedCollectionId).toBeNull();
    expect(
      result.current.filteredAndSortedLibraryItems.map((item) => item.id)
    ).toEqual(["reading"]);
  });

  it("keeps automatic and user-created collection filters mutually exclusive", () => {
    const { result } = renderHook(() => useBookmarkCollection());

    act(() => {
      result.current.setSelectedSmartCollectionId("unread");
      result.current.setSelectedCollectionId("custom");
    });

    expect(result.current.selectedCollectionId).toBe("custom");
    expect(result.current.selectedSmartCollectionId).toBeNull();

    act(() => {
      result.current.setSelectedSmartCollectionId("unread");
      result.current.clearCollectionFilters();
    });

    expect(result.current.selectedCollectionId).toBeNull();
    expect(result.current.selectedSmartCollectionId).toBeNull();
  });
});
