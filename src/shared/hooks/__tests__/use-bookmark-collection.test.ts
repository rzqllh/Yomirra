import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookmarkCollection } from "../use-bookmark-collection";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
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
  it("shows a single saved card for confirmed source bindings and keeps unverified collision separate", () => {
    const now = "2026-09-29T00:00:00.000Z";
    useLibraryStore.setState({ items: {
      a: { id: "a", sourceId: "source-a", mangaId: "a", title: "Same title", addedAt: now, updatedAt: now,
        linkedSources: [{ sourceId: "source-b", mangaId: "b", matchConfidence: "CONFIRMED", addedAt: 1 }] },
      b: { id: "b", sourceId: "source-b", mangaId: "b", title: "Same title", addedAt: now, updatedAt: now },
      c: { id: "c", sourceId: "source-c", mangaId: "c", title: "Same title", addedAt: now, updatedAt: now },
    } });
    const { result } = renderHook(() => useBookmarkCollection());
    expect(result.current.totalLibraryItemsCount).toBe(2);
    expect(result.current.filteredAndSortedLibraryItems.map(item => item.id)).toEqual(["a", "c"]);
    expect(Object.keys(useLibraryStore.getState().items)).toHaveLength(3);

    act(() => result.current.setSourceFilter("source-b"));
    expect(result.current.filteredAndSortedLibraryItems).toHaveLength(1);
    expect(result.current.filteredAndSortedLibraryItems[0].id).toBe("a");
  });

  it("does not expose a known-NSFW alternate from a safe source in canonical cards", () => {
    const now = "2026-11-23T00:00:00.000Z";
    useSettingsStore.setState({ hideNsfw: true });
    useLibraryStore.setState({ items: {
      safe: {
        id: "safe", sourceId: "mangadex", mangaId: "safe",
        title: "Safe chapter", addedAt: now, updatedAt: now, isNsfw: false,
        linkedSources: [{ sourceId: "komiku", mangaId: "adult", matchConfidence: "CONFIRMED", addedAt: 1 }],
      },
      adult: {
        id: "adult", sourceId: "komiku", mangaId: "adult",
        title: "Unsafe variant", addedAt: now, updatedAt: now, isNsfw: true,
      },
    } });
    const { result } = renderHook(() => useBookmarkCollection());
    expect(result.current.totalLibraryItemsCount).toBe(1);
    expect(result.current.paginatedCollection).toHaveLength(1);
    expect(result.current.paginatedCollection[0].sourceBindings).toEqual([
      expect.objectContaining({ sourceId: "mangadex", mangaId: "safe" }),
    ]);
  });

});
