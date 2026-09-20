import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveSourceFallback,
  executeSourceMigration,
  rollbackSourceMigration,
  migrationSnapshotRegistry,
} from "../source-fallback";
import { useLibraryStore, type LibraryItem } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { mapChapterProgress } from "../chapter-parser";

describe("Phase 5 E2E — Integrated Source Fallback, Migration & Rollback", () => {
  beforeEach(() => {
    migrationSnapshotRegistry.clear();
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({ items: {} });
  });

  it("completes full E2E flow: broken source -> auto safe fallback -> exact chapter map -> safe switch -> rollback", () => {
    const initialLibraryItem: LibraryItem = {
      id: "saved-title-e2e-001",
      title: "Solo Leveling",
      sourceId: "shinigami",
      mangaId: "sl-shinigami",
      primarySourceId: "shinigami",
      primaryMangaId: "sl-shinigami",
      linkedSources: [
        {
          sourceId: "komiku-ii",
          mangaId: "sl-komikuii",
          addedAt: Date.now() - 10000,
          matchConfidence: "CONFIRMED",
        },
      ],
      lastReadChapterId: "ch-100-shini",
      lastReadChapterTitle: "Chapter 100",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useLibraryStore.setState({
      items: {
        "saved-title-e2e-001": initialLibraryItem,
      },
    });

    // Initial reading history: reading Chapter 100 on page 12
    useHistoryStore.getState().upsertHistory({
      sourceId: "shinigami",
      mangaId: "sl-shinigami",
      chapterId: "ch-100-shini",
      chapterTitle: "Chapter 100",
      pageIndex: 12,
      mangaTitle: "Solo Leveling",
      readAt: Date.now() - 5000,
    });

    const initialHistory = useHistoryStore.getState().getLatestForManga("shinigami", "sl-shinigami");
    expect(initialHistory).toBeDefined();
    expect(initialHistory?.chapterId).toBe("ch-100-shini");
    expect(initialHistory?.pageIndex).toBe(12);

    const failedSourceHealth = {
      status: "BROKEN" as const,
      errorCode: "SOURCE_BROKEN" as const,
      message: "Upstream parser failed or 503 Service Unavailable",
    };

    // Candidate target chapters on Source B (komiku-ii)
    const targetChaptersMap = {
      "komiku-ii": [
        { chapterId: "ch-99-k2", chapterNumber: 99, title: "Chapter 99" },
        { chapterId: "ch-100-k2", chapterNumber: 100, title: "Chapter 100" },
        { chapterId: "ch-101-k2", chapterNumber: 101, title: "Chapter 101" },
      ],
    };

    const fallbackResult = resolveSourceFallback({
      savedTitle: initialLibraryItem,
      failedSourceId: "shinigami",
      health: failedSourceHealth,
      targetChaptersMap,
    });

    expect(fallbackResult.status).toBe("AUTO_SAFE");
    expect(fallbackResult.requiresUserConfirmation).toBe(false);
    expect(fallbackResult.candidate?.sourceId).toBe("komiku-ii");
    expect(fallbackResult.candidate?.mangaId).toBe("sl-komikuii");
    expect(fallbackResult.suggestedChapterId).toBe("ch-100-k2");
    expect(fallbackResult.suggestedChapterNumber).toBe(100);

    const snapshot = executeSourceMigration({
      libraryItem: initialLibraryItem,
      fallbackResult,
      historyItem: initialHistory,
      isPermanent: true,
      relinkTitleFn: (key, newSrc, newMid) => {
        useLibraryStore.getState().relinkTitle(key, newSrc, newMid);
      },
      saveProgressFn: (src, mid, cid, pidx) => {
        useHistoryStore.getState().upsertHistory({
          sourceId: src,
          mangaId: mid,
          chapterId: cid,
          pageIndex: pidx,
          mangaTitle: "Solo Leveling",
          readAt: Date.now(),
        });
      },
    });

    expect(snapshot.status).toBe("CONFIRMED");

    // A. SavedTitleId remains unchanged
    const migratedItem = useLibraryStore.getState().getLibraryItemById("saved-title-e2e-001");
    expect(migratedItem).toBeDefined();
    expect(migratedItem?.id).toBe("saved-title-e2e-001");
    expect(migratedItem?.primarySourceId).toBe("komiku-ii");
    expect(migratedItem?.primaryMangaId).toBe("sl-komikuii");

    // B. LinkedSources preserved and includes old primary provenance
    expect(migratedItem?.linkedSources?.some((s) => s.sourceId === "shinigami" && s.matchConfidence === "CONFIRMED")).toBe(true);

    // C. Old progress preserved under original source key
    const oldHistory = useHistoryStore.getState().getLatestForManga("shinigami", "sl-shinigami");
    expect(oldHistory?.chapterId).toBe("ch-100-shini");
    expect(oldHistory?.pageIndex).toBe(12);

    // D. New progress created under new source key with pageIndex reset to 0
    const newHistory = useHistoryStore.getState().getLatestForManga("komiku-ii", "sl-komikuii");
    expect(newHistory).toBeDefined();
    expect(newHistory?.chapterId).toBe("ch-100-k2");
    expect(newHistory?.pageIndex).toBe(0); // Reset appropriately!

    const rolledBackSnapshot = rollbackSourceMigration({
      snapshot,
      relinkTitleFn: (key, origSrc, origMid) => {
        useLibraryStore.getState().relinkTitle(key, origSrc, origMid);
      },
      saveProgressFn: (src, mid, cid, pidx) => {
        useHistoryStore.getState().upsertHistory({
          sourceId: src,
          mangaId: mid,
          chapterId: cid,
          pageIndex: pidx,
          mangaTitle: "Solo Leveling",
          readAt: Date.now(),
        });
      },
    });

    expect(rolledBackSnapshot.status).toBe("ROLLED_BACK");

    const rolledBackItem = useLibraryStore.getState().getLibraryItemById("saved-title-e2e-001");
    expect(rolledBackItem?.primarySourceId).toBe("shinigami");
    expect(rolledBackItem?.primaryMangaId).toBe("sl-shinigami");

    const rolledBackHistory = useHistoryStore.getState().getLatestForManga("shinigami", "sl-shinigami");
    expect(rolledBackHistory?.pageIndex).toBe(12);
  });

  it("handles ambiguous scenario: old progress = 57.5, candidate chapters = [57, 58] -> requires confirmation, never jumps to 58", () => {
    const item: LibraryItem = {
      id: "saved-ambiguous-001",
      title: "Omniscient Reader",
      sourceId: "source-a",
      mangaId: "orv-a",
      primarySourceId: "source-a",
      primaryMangaId: "orv-a",
      linkedSources: [
        {
          sourceId: "source-b",
          mangaId: "orv-b",
          addedAt: Date.now(),
          matchConfidence: "CONFIRMED",
        },
      ],
      lastReadChapterTitle: "Chapter 57.5",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targetChaptersMap = {
      "source-b": [
        { chapterId: "ch-57-b", chapterNumber: 57, title: "Chapter 57" },
        { chapterId: "ch-58-b", chapterNumber: 58, title: "Chapter 58" },
      ],
    };

    const fallbackResult = resolveSourceFallback({
      savedTitle: item,
      failedSourceId: "source-a",
      health: { status: "BROKEN", errorCode: "SOURCE_BROKEN" },
      targetChaptersMap,
    });

    // Must NOT be AUTO_SAFE
    expect(fallbackResult.status).toBe("CONFIRM_REQUIRED");
    expect(fallbackResult.requiresUserConfirmation).toBe(true);
    expect(fallbackResult.reason).toContain("Non-exact chapter mapping");

    // Must NOT silently select Chapter 58
    expect(fallbackResult.suggestedChapterNumber).not.toBe(58);
    // Nearest safe chapter must be <= 57.5, which is 57
    expect(fallbackResult.nearestSafeChapter?.chapterNumber).toBe(57);
    expect(fallbackResult.nearestSafeChapter?.chapterId).toBe("ch-57-b");
  });
});
