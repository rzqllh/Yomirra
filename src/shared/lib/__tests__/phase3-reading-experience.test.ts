import { describe, it, expect, beforeEach } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { getNavigationPathname, beginNavigationIntent, endNavigationIntent } from "@/shared/lib/navigation-intent";

describe("Phase 3 — Core Reading Experience Regression Suite", () => {
  beforeEach(() => {
    useLibraryStore.setState({ items: {} });
    endNavigationIntent();
  });

  describe("3.1 & 3.2 Explicit Bookmark Semantics (Rating / Collection Isolation)", () => {
    it("does not auto-add a manga to Library/Bookmark when user sets a rating", () => {
      const store = useLibraryStore.getState();

      // User sets rating without clicking bookmark
      store._setItemLocal({
        sourceId: "mangadex",
        mangaId: "manga-1",
        title: "Frieren",
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBookmarked: false,
        userRating: 9,
      });

      // Item exists and rating is preserved
      const item = useLibraryStore.getState().getLibraryItem("mangadex", "manga-1");
      expect(item).toBeDefined();
      expect(item?.userRating).toBe(9);

      // But it is strictly NOT in the user's Bookmarked Library
      expect(useLibraryStore.getState().isInLibrary("mangadex", "manga-1")).toBe(false);
    });

    it("marks an item as explicitly bookmarked when addToLibrary is invoked", () => {
      const store = useLibraryStore.getState();

      // First rated as unbookmarked
      store._setItemLocal({
        sourceId: "mangadex",
        mangaId: "manga-1",
        title: "Frieren",
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBookmarked: false,
        userRating: 9,
      });

      // Now user explicitly clicks Bookmark
      store.addToLibrary({
        sourceId: "mangadex",
        mangaId: "manga-1",
        title: "Frieren",
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const updated = useLibraryStore.getState().getLibraryItem("mangadex", "manga-1");
      expect(updated?.isBookmarked).toBe(true);
      expect(updated?.userRating).toBe(9); // rating preserved
      expect(useLibraryStore.getState().isInLibrary("mangadex", "manga-1")).toBe(true);
    });

    it("preserves rating but removes bookmark status when removeFromLibrary is called", () => {
      const store = useLibraryStore.getState();

      store.addToLibrary({
        sourceId: "mangadex",
        mangaId: "manga-1",
        title: "Frieren",
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      store.updateLibraryItem("mangadex", "manga-1", { userRating: 10 });

      expect(useLibraryStore.getState().isInLibrary("mangadex", "manga-1")).toBe(true);

      // User unbookmarks
      store.removeFromLibrary("mangadex", "manga-1");

      // No longer in library
      expect(useLibraryStore.getState().isInLibrary("mangadex", "manga-1")).toBe(false);

      // But rating is NOT discarded
      const retained = useLibraryStore.getState().getLibraryItem("mangadex", "manga-1");
      expect(retained?.userRating).toBe(10);
      expect(retained?.isBookmarked).toBe(false);
    });
  });

  describe("3.4 Reader Navigation & Chapter Intent", () => {
    it("handles chapter route transition intent cleanly without duplicate triggers", () => {
      const chapterHref = "/manga/mangadex/manga-1/read/ch-2";
      expect(getNavigationPathname(chapterHref)).toBe("/manga/mangadex/manga-1/read/ch-2");

      expect(beginNavigationIntent(chapterHref)).toBe(true);
      expect(beginNavigationIntent(chapterHref)).toBe(false);

      endNavigationIntent();
      expect(beginNavigationIntent(chapterHref)).toBe(true);
    });
  });
});
