import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useNsfwPatcher } from "../use-nsfw-patcher";

describe("deprecated NSFW patcher: legacy data must remain untouched", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibraryStore.setState({
      items: {
        "nsfw-source-1::manga-1": {
          sourceId: "nsfw-source-1",
          mangaId: "manga-1",
          title: "Legacy title",
          coverUrl: "",
          isNsfw: false,
          addedAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      },
    });
    useHistoryStore.setState({
      items: {
        "nsfw-source-1::manga-1::ch-1": {
          sourceId: "nsfw-source-1",
          mangaId: "manga-1",
          chapterId: "ch-1",
          mangaTitle: "Legacy title",
          readAt: Date.now(),
          isNsfw: false,
        },
      },
    });
  });

  it("does not rewrite Library/History or mark a migration complete on mount and rerender", () => {
    const beforeLibrary = useLibraryStore.getState().items;
    const beforeHistory = useHistoryStore.getState().items;
    const { rerender } = renderHook(() => useNsfwPatcher());
    rerender();

    expect(useLibraryStore.getState().items).toEqual(beforeLibrary);
    expect(useHistoryStore.getState().items).toEqual(beforeHistory);
    expect(useLibraryStore.getState().items["nsfw-source-1::manga-1"].isNsfw).toBe(false);
    expect(useHistoryStore.getState().items["nsfw-source-1::manga-1::ch-1"].isNsfw).toBe(false);
    expect(localStorage.getItem("yomirra_nsfw_patched_v2")).toBeNull();
  });

  it("preserves an existing legacy patch marker without rerunning backfill", () => {
    localStorage.setItem("yomirra_nsfw_patched_v2", "true");
    const library = useLibraryStore.getState().items;
    renderHook(() => useNsfwPatcher());
    expect(useLibraryStore.getState().items).toEqual(library);
    expect(localStorage.getItem("yomirra_nsfw_patched_v2")).toBe("true");
  });
});
