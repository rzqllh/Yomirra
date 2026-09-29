import { describe, expect, it } from "vitest";
import type { HistoryItem } from "@/shared/store/history-store";
import type { LibraryItem } from "@/shared/store/library-store";
import {
  deriveSmartCollections,
  type SmartCollectionId,
} from "../smart-collections";

const NOW = Date.UTC(2026, 8, 29, 8, 0, 0);
const day = (daysAgo: number) => new Date(NOW - daysAgo * 24 * 60 * 60 * 1000).toISOString();

function library(
  id: string,
  extra: Partial<LibraryItem> = {}
): LibraryItem {
  return {
    id,
    sourceId: "source-a",
    mangaId: id,
    title: id,
    addedAt: day(20),
    updatedAt: day(1),
    ...extra,
  };
}

function history(
  mangaId: string,
  daysAgo: number,
  extra: Partial<HistoryItem> = {}
): HistoryItem {
  return {
    sourceId: "source-a",
    mangaId,
    chapterId: `${mangaId}-chapter`,
    mangaTitle: mangaId,
    readAt: NOW - daysAgo * 24 * 60 * 60 * 1000,
    ...extra,
  };
}

function itemsFor(
  id: SmartCollectionId,
  collections: ReturnType<typeof deriveSmartCollections>
) {
  return collections.find((collection) => collection.id === id)?.items.map((item) => item.id) ?? [];
}

describe("smart collections", () => {
  it("derives reading, unread, recency, rating, stale, and format groups without persistence", () => {
    const libraryItems = [
      library("reading", { format: "Manhwa" }),
      library("unread", { format: "Manga" }),
      library("new", { addedAt: day(3), format: "Manhua" }),
      library("rated", { userRating: 9, format: "Manga" }),
      library("stale", { format: "Manhwa" }),
    ];
    const historyItems = [
      history("reading", 2, { seriesProgressPercent: 45 }),
      history("stale", 45, { seriesProgressPercent: 30 }),
    ];

    const collections = deriveSmartCollections(libraryItems, historyItems, { now: NOW });

    expect(itemsFor("continue-reading", collections)).toEqual(["reading", "stale"]);
    expect(itemsFor("unread", collections)).toContain("unread");
    expect(itemsFor("recently-added", collections)).toEqual(["new"]);
    expect(itemsFor("highly-rated", collections)).toEqual(["rated"]);
    expect(itemsFor("stale", collections)).toEqual(["stale"]);
    expect(itemsFor("format-manga", collections)).toEqual(["rated", "unread"]);
    expect(itemsFor("format-manhwa", collections)).toEqual(["reading", "stale"]);
    expect(itemsFor("format-manhua", collections)).toEqual(["new"]);
  });

  it("treats linked-source history as history for the saved title", () => {
    const item = library("saved", {
      sourceId: "source-a",
      mangaId: "primary",
      linkedSources: [
        {
          sourceId: "source-b",
          mangaId: "alternate",
          addedAt: NOW,
          matchConfidence: "CONFIRMED",
        },
      ],
    });

    const collections = deriveSmartCollections(
      [item],
      [history("alternate", 1, { sourceId: "source-b" })],
      { now: NOW }
    );

    expect(itemsFor("continue-reading", collections)).toEqual(["saved"]);
    expect(itemsFor("unread", collections)).toEqual([]);
  });

  it("does not keep a finished series in continue-reading or stale", () => {
    const item = library("finished", { status: "COMPLETED" });
    const collections = deriveSmartCollections(
      [item],
      [
        history("finished", 90, {
          seriesProgressPercent: 100,
          chapterIndex: 99,
          totalChapters: 100,
        }),
      ],
      { now: NOW }
    );

    expect(itemsFor("continue-reading", collections)).toEqual([]);
    expect(itemsFor("stale", collections)).toEqual([]);
    expect(itemsFor("completed-unfinished", collections)).toEqual([]);
  });

  it("shows completed publications only when reading has started but the series is unfinished", () => {
    const started = library("started", { status: "completed" });
    const untouched = library("untouched", { status: "COMPLETED" });
    const finished = library("finished", { status: "completed" });

    const collections = deriveSmartCollections(
      [started, untouched, finished],
      [
        history("started", 5, { chapterIndex: 4, totalChapters: 20 }),
        history("finished", 2, { chapterIndex: 19, totalChapters: 20 }),
      ],
      { now: NOW }
    );

    expect(itemsFor("completed-unfinished", collections)).toEqual(["started"]);
  });

  it("keeps time thresholds explicit and deterministic", () => {
    const collections = deriveSmartCollections(
      [
        library("recent-edge", { addedAt: day(14) }),
        library("recent-out", { addedAt: day(15) }),
        library("stale-edge"),
      ],
      [history("stale-edge", 30)],
      { now: NOW, recentDays: 14, staleDays: 30 }
    );

    expect(itemsFor("recently-added", collections)).toEqual(["recent-edge"]);
    expect(itemsFor("stale", collections)).toEqual(["stale-edge"]);
  });
});
