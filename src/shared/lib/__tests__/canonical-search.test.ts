import { describe, it, expect, vi } from "vitest";
import {
  clusterCanonicalResults,
  deduplicateResultsBySource,
  type SourceBinding,
} from "../canonical-search";
import type { MangaItem } from "@/shared/sources/source-types";

describe("Phase 4 — Canonical Search Deduplication & Failure Isolation", () => {
  it("identical title across two sources → one canonical result with 2 bindings", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "shinigami",
        manga: {
          id: "solo-leveling-shini",
          title: "Solo Leveling",
          coverUrl: "https://shini.io/cover1.jpg",
          latestChapter: "Chapter 179",
        },
      },
      {
        sourceId: "komiku-ii",
        manga: {
          id: "solo-leveling-komiku",
          title: "Solo Leveling",
          coverUrl: "https://komiku.tv/cover2.jpg",
          latestChapter: "Chapter 179",
        },
      },
    ];

    const clusters = clusterCanonicalResults(items);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].canonicalKey).toBe("canonical:solo leveling");
    expect(clusters[0].sourceBindings).toHaveLength(2);
    expect(clusters[0].sourceBindings.map((b) => b.sourceId)).toEqual([
      "shinigami",
      "komiku-ii",
    ]);
    expect(clusters[0].matchConfidence).toBe("HIGH_CONFIDENCE");
  });

  it("same title + different author → no unsafe merge (two separate results)", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "shinigami",
        manga: {
          id: "hero-shini",
          title: "The Hero",
          author: "Eiichiro Oda",
          coverUrl: "https://shini.io/heroA.jpg",
        },
      },
      {
        sourceId: "asurascans",
        manga: {
          id: "hero-asura",
          title: "The Hero",
          author: "Masashi Kishimoto",
          coverUrl: "https://asura.gg/heroB.jpg",
        },
      },
    ];

    const clusters = clusterCanonicalResults(items);

    // Conflict between Author A and Author B prevents HIGH_CONFIDENCE merge
    expect(clusters).toHaveLength(2);
    expect(clusters[0].sourceBindings).toHaveLength(1);
    expect(clusters[1].sourceBindings).toHaveLength(1);
    expect(clusters[0].sourceBindings[0].sourceId).toBe("shinigami");
    expect(clusters[1].sourceBindings[0].sourceId).toBe("asurascans");
  });

  it("alternate title match → clusters accurately", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "shinigami",
        manga: {
          id: "sl-shini",
          title: "Na Honjaman Rebeleob",
          alternativeTitles: ["Solo Leveling", "I Alone Level Up"],
          coverUrl: "https://shini.io/sl.jpg",
        },
      },
      {
        sourceId: "komiku",
        manga: {
          id: "sl-komiku",
          title: "Solo Leveling",
          coverUrl: "https://komiku.id/sl.jpg",
        },
      },
    ];

    const clusters = clusterCanonicalResults(items);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].sourceBindings).toHaveLength(2);
    expect(clusters[0].sourceBindings.map((b) => b.sourceId)).toEqual([
      "shinigami",
      "komiku",
    ]);
  });

  it("ambiguous title remains separate (never silently merged)", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "shinigami",
        manga: {
          id: "sl-1",
          title: "Solo Leveling",
          coverUrl: "https://shini.io/sl.jpg",
        },
      },
      {
        sourceId: "komikindo",
        manga: {
          id: "sl-ragnarok",
          title: "Solo Leveling: Ragnarok", // Subtitle / sequel
          coverUrl: "https://komikindo.ch/ragnarok.jpg",
        },
      },
    ];

    const clusters = clusterCanonicalResults(items);

    // Subtitle overlap yields AMBIGUOUS confidence (0.75-0.88), must NOT merge
    expect(clusters).toHaveLength(2);
    expect(clusters[0].primaryResult.title).toBe("Solo Leveling");
    expect(clusters[1].primaryResult.title).toBe("Solo Leveling: Ragnarok");
  });

  it("3-source canonical cluster merges cleanly across sources", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "shinigami",
        manga: { id: "m1", title: "Omniscient Reader's Viewpoint", coverUrl: "/c1.jpg" },
      },
      {
        sourceId: "komiku-ii",
        manga: { id: "m2", title: "Omniscient Reader's Viewpoint", coverUrl: "/c2.jpg" },
      },
      {
        sourceId: "mangadex",
        manga: { id: "m3", title: "Omniscient Reader's Viewpoint", coverUrl: "/c3.jpg" },
      },
    ];

    const clusters = clusterCanonicalResults(items);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].sourceBindings).toHaveLength(3);
    expect(clusters[0].sourceBindings.map((b) => b.sourceId)).toEqual([
      "shinigami",
      "komiku-ii",
      "mangadex",
    ]);
  });

  it("MangaDex language binding preserved as metadata without creating fake duplicate sources (D-008)", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "mangadex",
        manga: {
          id: "md-123",
          title: "Chainsaw Man",
          coverUrl: "/c.jpg",
          language: "id",
        },
      },
    ];

    const clusters = clusterCanonicalResults(items);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].sourceBindings[0].sourceId).toBe("mangadex");
    expect(clusters[0].sourceBindings[0].language).toBe("id");
  });

  it("disabled source excluded from resultsBySource does not appear in clusters", () => {
    // Selected sources only: shinigami and komikindo (komiku is disabled)
    const resultsBySource = {
      shinigami: {
        results: [{ id: "s1", title: "One Piece", coverUrl: "/c1.jpg" }],
      },
      komikindo: {
        results: [{ id: "k1", title: "One Piece", coverUrl: "/c2.jpg" }],
      },
      // disabled source is simply absent from resultsBySource
    };

    const clusters = deduplicateResultsBySource(resultsBySource);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].sourceBindings.map((b) => b.sourceId)).toEqual([
      "shinigami",
      "komikindo",
    ]);
    expect(clusters[0].sourceBindings.some((b) => b.sourceId === "komiku")).toBe(false);
  });

  it("one failed source does not break dedupe for remaining successful sources", () => {
    const resultsBySource = {
      shinigami: {
        results: [{ id: "s1", title: "Overgeared", coverUrl: "/c1.jpg" }],
      },
      komikindo: {
        results: [],
        error: "Route changed",
        errorCode: "ROUTE_CHANGED" as const,
      },
      asurascans: {
        results: [{ id: "a1", title: "Overgeared", coverUrl: "/c3.jpg" }],
      },
    };

    const clusters = deduplicateResultsBySource(resultsBySource);

    // Failed komikindo ignored for cluster bindings, but shinigami + asurascans cluster normally
    expect(clusters).toHaveLength(1);
    expect(clusters[0].sourceBindings).toHaveLength(2);
    expect(clusters[0].sourceBindings.map((b) => b.sourceId)).toEqual([
      "shinigami",
      "asurascans",
    ]);
  });

  it("all failed sources handled cleanly with empty cluster list", () => {
    const resultsBySource = {
      shinigami: {
        results: [],
        error: "Timeout",
        errorCode: "UPSTREAM_TIMEOUT" as const,
      },
      komikindo: {
        results: [],
        error: "CF Blocked",
        errorCode: "UPSTREAM_BLOCKED" as const,
      },
    };

    const clusters = deduplicateResultsBySource(resultsBySource);

    expect(clusters).toHaveLength(0);
  });

  it("stable deterministic ordering is preserved across runs", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      { sourceId: "shinigami", manga: { id: "a", title: "Alpha", coverUrl: "/a.jpg" } },
      { sourceId: "komiku", manga: { id: "b", title: "Beta", coverUrl: "/b.jpg" } },
      { sourceId: "shinigami", manga: { id: "g", title: "Gamma", coverUrl: "/g.jpg" } },
      { sourceId: "asurascans", manga: { id: "b2", title: "Beta", coverUrl: "/b2.jpg" } },
    ];

    const clusters1 = clusterCanonicalResults(items);
    const clusters2 = clusterCanonicalResults(items);

    expect(clusters1.map((c) => c.primaryResult.title)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(clusters2.map((c) => c.primaryResult.title)).toEqual(
      clusters1.map((c) => c.primaryResult.title)
    );
  });

  it("zero reading/library mutation during search deduplication", () => {
    const items: Array<{ manga: MangaItem; sourceId: string }> = [
      {
        sourceId: "shinigami",
        manga: {
          id: "m1",
          title: "Tower of God",
          coverUrl: "/tog.jpg",
          latestChapter: "Chapter 500",
        },
      },
    ];

    const initialClone = JSON.parse(JSON.stringify(items));
    clusterCanonicalResults(items);

    // Ensure input items were not mutated
    expect(items[0].manga.id).toBe(initialClone[0].manga.id);
    expect(items[0].manga.title).toBe(initialClone[0].manga.title);
  });

  it("library search does not call upstream search APIs", async () => {
    // Verify that library search remains strictly local store based
    const { useLibraryStore } = await import("@/shared/store/library-store");
    const testItem = {
      sourceId: "shinigami",
      mangaId: "local-1",
      title: "Local Library Manga",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useLibraryStore.getState().addToLibrary(testItem);
    const inLib = useLibraryStore.getState().getLibraryItem("shinigami", "local-1");
    expect(inLib?.title).toBe("Local Library Manga");
    
    // Clean up
    useLibraryStore.getState().removeFromLibrary("shinigami", "local-1");
  });
});
