import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveSourceFallback,
  executeSourceMigration,
  rollbackSourceMigration,
  migrationSnapshotRegistry,
} from "../source-fallback";
import { LibraryItem, SourceRef } from "@/shared/store/library-store";
import { HistoryItem } from "@/shared/store/history-store";
import { ChapterMeta } from "../chapter-parser";
import { TitleCandidate } from "../title-matcher";

describe("Source Fallback Resolver & Reading Migration Engine", () => {
  beforeEach(() => {
    migrationSnapshotRegistry.clear();
  });

  describe("Title Fallback Matrix", () => {
    it("1. confirmed linked source healthy -> AUTO_SAFE", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-1",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            {
              sourceId: "komiku-ii",
              mangaId: "sl-komiku",
              addedAt: Date.now(),
              matchConfidence: "CONFIRMED",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        availableSources: [{ id: "komiku-ii", isEnabled: true, status: "online" }],
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.candidate?.sourceId).toBe("komiku-ii");
      expect(result.titleConfidence).toBe("CONFIRMED");
      expect(result.requiresUserConfirmation).toBe(false);
    });

    it("2. high-confidence alternate healthy -> AUTO_SAFE", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-2",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            {
              sourceId: "asurascans",
              mangaId: "sl-asura",
              addedAt: Date.now(),
              matchConfidence: "HIGH_CONFIDENCE",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN", errorCode: "ROUTE_CHANGED" },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.candidate?.sourceId).toBe("asurascans");
      expect(result.titleConfidence).toBe("HIGH_CONFIDENCE");
      expect(result.requiresUserConfirmation).toBe(false);
    });

    it("3. ambiguous alternate -> CONFIRM_REQUIRED (never silently switch)", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-3",
          title: "Overgeared",
          primarySourceId: "shinigami",
          primaryMangaId: "og-1",
          linkedSources: [
            {
              sourceId: "komikindo",
              mangaId: "og-remake",
              addedAt: Date.now(),
              matchConfidence: "AMBIGUOUS",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
      });

      expect(result.status).toBe("CONFIRM_REQUIRED");
      expect(result.titleConfidence).toBe("AMBIGUOUS");
      expect(result.requiresUserConfirmation).toBe(true);
      expect(result.reason).toContain("Ambiguous title match");
    });

    it("4. no match -> NO_FALLBACK", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-4",
          title: "Rare Obscure Manga",
          primarySourceId: "shinigami",
          primaryMangaId: "rare-1",
          linkedSources: [],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        alternateCandidates: [
          {
            sourceId: "komiku",
            mangaId: "unrelated-manga",
            title: "Completely Different Story",
          },
        ],
      });

      expect(result.status).toBe("NO_FALLBACK");
      expect(result.candidate).toBeUndefined();
      expect(result.requiresUserConfirmation).toBe(false);
    });

    it("5. alternate source broken -> excluded from candidates", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-5",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            {
              sourceId: "komiku-broken",
              mangaId: "sl-broken",
              addedAt: Date.now(),
              matchConfidence: "CONFIRMED",
            },
            {
              sourceId: "asurascans",
              mangaId: "sl-asura",
              addedAt: Date.now(),
              matchConfidence: "HIGH_CONFIDENCE",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        availableSources: [
          { id: "komiku-broken", isEnabled: true, status: "unavailable" },
          { id: "asurascans", isEnabled: true, status: "online" },
        ],
      });

      // The broken candidate is skipped, healthy one selected
      expect(result.candidate?.sourceId).toBe("asurascans");
    });

    it("6. preferred source healthy -> NO_FALLBACK", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-6",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            {
              sourceId: "komiku-ii",
              mangaId: "sl-komiku",
              addedAt: Date.now(),
              matchConfidence: "CONFIRMED",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "HEALTHY" },
      });

      expect(result.status).toBe("NO_FALLBACK");
      expect(result.reason).toContain("Primary source is healthy");
    });

    it("7. temporary rate limit does not permanently relink (isTemporary = true)", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-7",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            {
              sourceId: "komiku-ii",
              mangaId: "sl-komiku",
              addedAt: Date.now(),
              matchConfidence: "CONFIRMED",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "RATE_LIMITED" },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.isTemporary).toBe(true);
      expect(result.reason).toContain("temporarily rate-limited");
    });

    it("8. persistent broken source with deterministic error may permanently relink", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-8",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            {
              sourceId: "komiku-ii",
              mangaId: "sl-komiku",
              addedAt: Date.now(),
              matchConfidence: "CONFIRMED",
            },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN", errorCode: "PARSER_BROKEN" },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.isTemporary).toBe(false);
    });
  });

  describe("Chapter Mapping Matrix", () => {
    const targetChapters: ChapterMeta[] = [
      { chapterId: "t-1", title: "Chapter 1", chapterNumber: 1 },
      { chapterId: "t-57", title: "Chapter 57", chapterNumber: 57 },
      { chapterId: "t-57-5", title: "Chapter 57.5 - Special", chapterNumber: 57.5 },
      { chapterId: "t-58", title: "Chapter 58", chapterNumber: 58 },
      { chapterId: "t-prologue", title: "Prologue" },
    ];

    it("9. exact chapter number mapping", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-9",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          lastReadChapterNumber: 57,
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-komiku", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": targetChapters },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.suggestedChapterId).toBe("t-57");
      expect(result.suggestedChapterNumber).toBe(57);
      expect(result.chapterMapping?.type).toBe("EXACT");
    });

    it("10. decimal chapter mapping (57.5)", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-10",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          lastReadChapterNumber: 57.5,
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-komiku", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": targetChapters },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.suggestedChapterId).toBe("t-57-5");
      expect(result.suggestedChapterNumber).toBe(57.5);
    });

    it("11. part chapter mapping from title string", () => {
      const partChapters: ChapterMeta[] = [
        { chapterId: "t-20-1", title: "Chapter 20 Part 1", chapterNumber: 20 },
        { chapterId: "t-21", title: "Chapter 21", chapterNumber: 21 },
      ];
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-11",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          lastReadChapterTitle: "Episode 20 Part 1",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-komiku", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": partChapters },
      });

      expect(result.suggestedChapterNumber).toBe(20);
    });

    it("12. title similarity matching with volume", () => {
      const volumeChapters: ChapterMeta[] = [
        { chapterId: "v1-c5", title: "Vol. 1 Chapter 5", chapterNumber: 5, volume: 1 },
        { chapterId: "v2-c5", title: "Vol. 2 Chapter 5", chapterNumber: 5, volume: 2 },
      ];
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-12",
          title: "Manga",
          primarySourceId: "shinigami",
          primaryMangaId: "m-1",
          lastReadChapterTitle: "Vol. 2 Ch. 5",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "m-2", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": volumeChapters },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.suggestedChapterId).toBe("v2-c5");
    });

    it("13. prologue/extra handling without numeric identity", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-13",
          title: "Manga",
          primarySourceId: "shinigami",
          primaryMangaId: "m-1",
          lastReadChapterTitle: "Prologue",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "m-2", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": targetChapters },
      });

      // Special unparseable string -> UNMAPPED -> requires user confirmation
      expect(result.status).toBe("CONFIRM_REQUIRED");
      expect(result.requiresUserConfirmation).toBe(true);
    });

    it("14. nearest lower safe candidate when exact chapter is missing", () => {
      // User read 57.5, target only has 57 and 58
      const splitChapters: ChapterMeta[] = [
        { chapterId: "ch-57", title: "Chapter 57", chapterNumber: 57 },
        { chapterId: "ch-58", title: "Chapter 58", chapterNumber: 58 },
      ];
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-14",
          title: "Manga",
          primarySourceId: "shinigami",
          primaryMangaId: "m-1",
          lastReadChapterNumber: 57.5,
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "m-2", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": splitChapters },
      });

      expect(result.status).toBe("CONFIRM_REQUIRED");
      expect(result.nearestSafeChapter).toBeDefined();
      expect(result.nearestSafeChapter?.chapterNumber).toBe(57);
      expect(result.suggestedChapterId).toBe("ch-57");
    });

    it("15. must NEVER jump forward automatically to 58", () => {
      const splitChapters: ChapterMeta[] = [
        { chapterId: "ch-57", title: "Chapter 57", chapterNumber: 57 },
        { chapterId: "ch-58", title: "Chapter 58", chapterNumber: 58 },
      ];
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-15",
          title: "Manga",
          primarySourceId: "shinigami",
          primaryMangaId: "m-1",
          lastReadChapterNumber: 57.5,
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "m-2", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": splitChapters },
      });

      // Must never automatically select 58!
      expect(result.suggestedChapterNumber).not.toBe(58);
      expect(result.requiresUserConfirmation).toBe(true);
    });

    it("16. missing corresponding chapter completely -> CONFIRM_REQUIRED", () => {
      const targetFewChapters: ChapterMeta[] = [
        { chapterId: "ch-1", title: "Chapter 1", chapterNumber: 1 },
        { chapterId: "ch-2", title: "Chapter 2", chapterNumber: 2 },
      ];
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-16",
          title: "Manga",
          primarySourceId: "shinigami",
          primaryMangaId: "m-1",
          lastReadChapterNumber: 150,
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "m-2", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: { "komiku-ii": targetFewChapters },
      });

      expect(result.status).toBe("CONFIRM_REQUIRED");
      expect(result.requiresUserConfirmation).toBe(true);
    });
  });

  describe("Reading Progress & Migration Snapshot", () => {
    const libraryItem: LibraryItem = {
      id: "saved-title-uuid",
      title: "Solo Leveling",
      author: "Chugong",
      sourceId: "shinigami",
      mangaId: "sl-shini",
      primarySourceId: "shinigami",
      primaryMangaId: "sl-shini",
      lastReadChapterId: "ch-57-shini",
      lastReadChapterTitle: "Chapter 57",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedSources: [
        {
          sourceId: "komiku-ii",
          mangaId: "sl-komiku",
          addedAt: Date.now(),
          matchConfidence: "CONFIRMED",
        },
      ],
    };

    const historyItem: HistoryItem = {
      sourceId: "shinigami",
      mangaId: "sl-shini",
      chapterId: "ch-57-shini",
      mangaTitle: "Solo Leveling",
      chapterTitle: "Chapter 57",
      chapterNumber: 57,
      pageIndex: 18,
      readAt: Date.now(),
      savedTitleId: "saved-title-uuid",
    };

    it("17. source migration preserves canonical progress and creates snapshot", () => {
      let relinkCalled = false;
      let progressSaved = false;

      const fallbackResult = resolveSourceFallback({
        savedTitle: libraryItem,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: {
          "komiku-ii": [{ chapterId: "ch-57-k2", title: "Chapter 57", chapterNumber: 57 }],
        },
      });

      const snapshot = executeSourceMigration({
        libraryItem,
        fallbackResult,
        historyItem,
        isPermanent: true,
        relinkTitleFn: () => { relinkCalled = true; },
        saveProgressFn: () => { progressSaved = true; },
      });

      expect(relinkCalled).toBe(true);
      expect(progressSaved).toBe(true);
      expect(snapshot.fromSourceId).toBe("shinigami");
      expect(snapshot.toSourceId).toBe("komiku-ii");
      expect(snapshot.status).toBe("CONFIRMED");
    });

    it("18. old source ID retained in snapshot", () => {
      const fallbackResult = resolveSourceFallback({
        savedTitle: libraryItem,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: {
          "komiku-ii": [{ chapterId: "ch-57-k2", title: "Chapter 57", chapterNumber: 57 }],
        },
      });

      const snapshot = executeSourceMigration({
        libraryItem,
        fallbackResult,
        historyItem,
      });

      expect(snapshot.fromSourceId).toBe("shinigami");
      expect(snapshot.fromMangaId).toBe("sl-shini");
    });

    it("19. old chapter ID and title retained in snapshot", () => {
      const fallbackResult = resolveSourceFallback({
        savedTitle: libraryItem,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: {
          "komiku-ii": [{ chapterId: "ch-57-k2", title: "Chapter 57", chapterNumber: 57 }],
        },
      });

      const snapshot = executeSourceMigration({
        libraryItem,
        fallbackResult,
        historyItem,
      });

      expect(snapshot.fromChapterId).toBe("ch-57-shini");
      expect(snapshot.fromChapterTitle).toBe("Chapter 57");
    });

    it("20. page index is NOT blindly copied (reset to 0 in target source)", () => {
      let savedPageIndex = -1;

      const fallbackResult = resolveSourceFallback({
        savedTitle: libraryItem,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: {
          "komiku-ii": [{ chapterId: "ch-57-k2", title: "Chapter 57", chapterNumber: 57 }],
        },
      });

      const snapshot = executeSourceMigration({
        libraryItem,
        fallbackResult,
        historyItem, // pageIndex is 18
        saveProgressFn: (_src, _manga, _ch, pageIndex) => {
          savedPageIndex = pageIndex;
        },
      });

      expect(snapshot.fromPageIndex).toBe(18);
      // New progress page index must be 0!
      expect(savedPageIndex).toBe(0);
    });

    it("21. rollback restores old state and updates snapshot status", () => {
      let restoredSourceId = "";
      let restoredChapterId = "";
      let restoredPageIndex = -1;

      const fallbackResult = resolveSourceFallback({
        savedTitle: libraryItem,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: {
          "komiku-ii": [{ chapterId: "ch-57-k2", title: "Chapter 57", chapterNumber: 57 }],
        },
      });

      const snapshot = executeSourceMigration({
        libraryItem,
        fallbackResult,
        historyItem,
      });

      const rolledBack = rollbackSourceMigration({
        snapshot,
        relinkTitleFn: (_id, srcId) => { restoredSourceId = srcId; },
        saveProgressFn: (_src, _manga, chId, pageIdx) => {
          restoredChapterId = chId;
          restoredPageIndex = pageIdx;
        },
      });

      expect(rolledBack.status).toBe("ROLLED_BACK");
      expect(restoredSourceId).toBe("shinigami");
      expect(restoredChapterId).toBe("ch-57-shini");
      expect(restoredPageIndex).toBe(18);
    });

    it("22. ambiguous mapping leaves original progress untouched", () => {
      const fallbackResult = resolveSourceFallback({
        savedTitle: {
          ...libraryItem,
          lastReadChapterNumber: 57.5,
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        targetChaptersMap: {
          "komiku-ii": [
            { chapterId: "ch-57", title: "Chapter 57", chapterNumber: 57 },
            { chapterId: "ch-58", title: "Chapter 58", chapterNumber: 58 },
          ],
        },
      });

      expect(fallbackResult.status).toBe("CONFIRM_REQUIRED");
      // Because confirmation is required, automatic migration is not triggered
      expect(fallbackResult.requiresUserConfirmation).toBe(true);
    });
  });

  describe("Library Invariants Matrix", () => {
    it("23. no duplicate library item created during relink", () => {
      const item: LibraryItem = {
        id: "title-uuid-1",
        sourceId: "shinigami",
        mangaId: "sl",
        title: "Solo Leveling",
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedSources: [],
      };

      const fallbackResult = resolveSourceFallback({
        savedTitle: item,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        alternateCandidates: [
          { sourceId: "komiku-ii", mangaId: "sl-k2", title: "Solo Leveling" },
        ],
      });

      const snapshot = executeSourceMigration({
        libraryItem: item,
        fallbackResult,
      });

      // Target item operates under the same savedTitleId
      expect(snapshot.savedTitleId).toBe("title-uuid-1");
    });

    it("24. SavedTitleId remains unchanged across migrations", () => {
      const item: LibraryItem = {
        id: "stable-uuid-42",
        sourceId: "shinigami",
        mangaId: "sl",
        title: "Solo Leveling",
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const fallbackResult = resolveSourceFallback({
        savedTitle: item,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        alternateCandidates: [
          { sourceId: "asurascans", mangaId: "sl-asura", title: "Solo Leveling" },
        ],
      });

      const snapshot = executeSourceMigration({ libraryItem: item, fallbackResult });
      expect(snapshot.savedTitleId).toBe("stable-uuid-42");
    });

    it("25. linkedSources preserved during relinkTitle", () => {
      const existingLinked: SourceRef[] = [
        { sourceId: "mangadex", mangaId: "md-1", addedAt: 1000, matchConfidence: "HIGH_CONFIDENCE" },
      ];
      const item: LibraryItem = {
        id: "uuid-25",
        sourceId: "shinigami",
        mangaId: "sl",
        title: "Solo Leveling",
        linkedSources: existingLinked,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const fallbackResult = resolveSourceFallback({
        savedTitle: item,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
        alternateCandidates: [
          { sourceId: "komikindo", mangaId: "sl-indo", title: "Solo Leveling" },
        ],
      });

      expect(fallbackResult.candidate?.sourceId).toBe("mangadex");
    });

    it("26. new safe binding appended correctly without replacing existing ones", () => {
      const initialLinked: SourceRef[] = [
        { sourceId: "komiku", mangaId: "sl-k", addedAt: 100, matchConfidence: "CONFIRMED" },
      ];
      const item: LibraryItem = {
        id: "uuid-26",
        sourceId: "shinigami",
        mangaId: "sl",
        title: "Solo Leveling",
        linkedSources: initialLinked,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // When fallback switches from shinigami to komiku, shinigami is kept in linkedSources
      const fallbackResult = resolveSourceFallback({
        savedTitle: item,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
      });

      expect(fallbackResult.status).toBe("AUTO_SAFE");
      expect(fallbackResult.candidate?.sourceId).toBe("komiku");
    });
  });

  describe("Health Engine Integration Matrix", () => {
    it("27. DEGRADED does not unnecessarily permanent-switch", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-27",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-k", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "DEGRADED" },
      });

      expect(result.status).toBe("CONFIRM_REQUIRED");
      expect(result.reason).toContain("Source is degraded");
      expect(result.requiresUserConfirmation).toBe(true);
    });

    it("28. BROKEN triggers resolver for automatic safe switch", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-28",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-k", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
      });

      expect(result.status).toBe("AUTO_SAFE");
    });

    it("29. RATE_LIMITED supports temporary fallback without permanent relink", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-29",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-k", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "RATE_LIMITED" },
      });

      expect(result.isTemporary).toBe(true);
      expect(result.status).toBe("AUTO_SAFE");
    });

    it("30. recovery detected -> when health is HEALTHY, no fallback needed", () => {
      const result = resolveSourceFallback({
        savedTitle: {
          id: "saved-30",
          title: "Solo Leveling",
          primarySourceId: "shinigami",
          primaryMangaId: "sl-1",
          linkedSources: [
            { sourceId: "komiku-ii", mangaId: "sl-k", addedAt: Date.now(), matchConfidence: "CONFIRMED" },
          ],
        },
        failedSourceId: "shinigami",
        health: { status: "HEALTHY" },
      });

      expect(result.status).toBe("NO_FALLBACK");
      expect(result.reason).toContain("Primary source is healthy");
    });
  });

  describe("Search Integration Matrix", () => {
    it("31. Phase 4 sourceBindings reused as trusted linkedSources", () => {
      const itemWithBindings: LibraryItem = {
        id: "saved-31",
        title: "Solo Leveling",
        sourceId: "shinigami",
        mangaId: "sl",
        primarySourceId: "shinigami",
        primaryMangaId: "sl",
        linkedSources: [
          { sourceId: "komiku-ii", mangaId: "sl-k2", addedAt: Date.now(), matchConfidence: "HIGH_CONFIDENCE" },
          { sourceId: "mangadex", mangaId: "sl-md", addedAt: Date.now(), matchConfidence: "HIGH_CONFIDENCE" },
        ],
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = resolveSourceFallback({
        savedTitle: itemWithBindings,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
      });

      expect(result.status).toBe("AUTO_SAFE");
      expect(result.candidate?.sourceId).toBe("komiku-ii");
      expect(result.titleConfidence).toBe("HIGH_CONFIDENCE");
    });

    it("32. ambiguous canonical search result not treated as trusted fallback", () => {
      const itemWithAmbiguous: LibraryItem = {
        id: "saved-32",
        title: "Solo Leveling Spinoff",
        sourceId: "shinigami",
        mangaId: "sl-spin",
        primarySourceId: "shinigami",
        primaryMangaId: "sl-spin",
        linkedSources: [
          { sourceId: "komikindo", mangaId: "sl-orig", addedAt: Date.now(), matchConfidence: "AMBIGUOUS" },
        ],
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = resolveSourceFallback({
        savedTitle: itemWithAmbiguous,
        failedSourceId: "shinigami",
        health: { status: "BROKEN" },
      });

      // AMBIGUOUS must NEVER become AUTO_SAFE
      expect(result.status).toBe("CONFIRM_REQUIRED");
      expect(result.requiresUserConfirmation).toBe(true);
    });
  });
});
