import { describe, it, expect, beforeEach } from "vitest";
import { executeCanonicalMigration } from "../canonical-migration";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaKey } from "@/shared/types/collection";

describe("Phase 4.4 & 4.5 — Persistent Canonical Catalog & Migration", () => {
  beforeEach(() => {
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({ items: {} });
    useCollectionStore.setState({
      collections: [],
      membershipsByManga: {},
      readingStatusByManga: {},
    });
  });

  it("backfills legacy history items with matching canonical ID from library", () => {
    // 1. Seed library with canonical item that has linkedSources
    useLibraryStore.setState({
      items: {
        "canonical:solo-leveling": {
          id: "canonical:solo-leveling",
          sourceId: "shinigami",
          mangaId: "sl-shini",
          title: "Solo Leveling",
          linkedSources: [
            { sourceId: "shinigami", mangaId: "sl-shini", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
            { sourceId: "komiku", mangaId: "sl-komiku", addedAt: Date.now(), matchConfidence: "HIGH_CONFIDENCE" },
          ],
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isBookmarked: true,
        },
      },
    });

    // 2. Seed history with legacy item (no savedTitleId)
    useHistoryStore.setState({
      items: {
        "komiku::sl-komiku": {
          sourceId: "komiku",
          mangaId: "sl-komiku",
          chapterId: "ch-50",
          mangaTitle: "Solo Leveling",
          chapterTitle: "Ch. 50",
          readAt: Date.now(),
        },
      },
    });

    // 3. Execute migration
    const result = executeCanonicalMigration();
    expect(result.historyChanged).toBe(true);

    // 4. Verify backfill
    const history = useHistoryStore.getState().items;
    expect(history["komiku::sl-komiku"].savedTitleId).toBe("canonical:solo-leveling");
  });

  it("merges legacy memberships and reading status into canonical key additively", () => {
    useLibraryStore.setState({
      items: {
        "canonical:one-piece": {
          id: "canonical:one-piece",
          sourceId: "shinigami",
          mangaId: "op-shini",
          title: "One Piece",
          linkedSources: [
            { sourceId: "shinigami", mangaId: "op-shini", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isBookmarked: true,
        },
      },
    });

    const legacyKey = "shinigami::op-shini" as MangaKey;
    const canonicalKey = "canonical:one-piece" as MangaKey;

    useCollectionStore.setState({
      membershipsByManga: {
        [legacyKey]: ["favorites", "top-tier"],
      },
      readingStatusByManga: {
        [legacyKey]: "reading",
      },
    });

    const result = executeCanonicalMigration();
    expect(result.collectionsChanged).toBe(true);

    const collectionState = useCollectionStore.getState();
    expect(collectionState.membershipsByManga[canonicalKey]).toEqual(["favorites", "top-tier"]);
    expect(collectionState.readingStatusByManga[canonicalKey]).toBe("reading");
  });
});
