import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useNsfwPatcher } from "../use-nsfw-patcher";
import type { NsfwClassificationStatus } from "../use-nsfw-source-ids";

let mockStatus: NsfwClassificationStatus = "LOADING";
let mockIds = new Set<string>(["nsfw-source-1"]);

vi.mock("../use-nsfw-source-ids", () => ({
  useNsfwSourceIds: () => ({
    status: mockStatus,
    ids: mockIds,
  }),
}));

describe("useNsfwPatcher", () => {
  beforeEach(() => {
    localStorage.clear();
    mockStatus = "LOADING";
    mockIds = new Set<string>(["nsfw-source-1"]);

    useLibraryStore.setState({
      items: {
        "nsfw-source-1::manga-1": {
          sourceId: "nsfw-source-1",
          mangaId: "manga-1",
          title: "NSFW Manga 1",
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
          mangaTitle: "NSFW Manga 1",
          readAt: Date.now(),
          isNsfw: false,
        },
      },
    });
  });

  it("patches legacy items when status transitions from LOADING to KNOWN", () => {
    const { rerender } = renderHook(() => useNsfwPatcher());

    // Initially LOADING -> nothing patched
    expect(localStorage.getItem("yomirra_nsfw_patched_v2")).toBeNull();
    expect(useLibraryStore.getState().items["nsfw-source-1::manga-1"].isNsfw).toBe(false);

    // Transition status to KNOWN without changing Set instance
    mockStatus = "KNOWN";
    act(() => {
      rerender();
    });

    // Patcher should have run
    expect(localStorage.getItem("yomirra_nsfw_patched_v2")).toBe("true");
    expect(useLibraryStore.getState().items["nsfw-source-1::manga-1"].isNsfw).toBe(true);
    expect(useHistoryStore.getState().items["nsfw-source-1::manga-1::ch-1"].isNsfw).toBe(true);
  });
});
