import { describe, it, expect } from "vitest";
import { mergeFilters, pruneUnsupportedFilters, buildPayloadForSource } from "../filter-helpers";
import type { FilterList } from "@/shared/sources/source-types";

describe("filter-helpers", () => {
  const sourceA: { sourceId: string; filters: FilterList } = {
    sourceId: "sourceA",
    filters: {
      genres: [{ id: "action", name: "Action" }, { id: "romance", name: "Romance" }],
      formats: [{ id: "manga", name: "Manga" }],
      statuses: [{ id: "ongoing", name: "Ongoing" }],
      sorts: [{ id: "popular", name: "Popular" }, { id: "latest", name: "Latest" }]
    }
  };

  const sourceB: { sourceId: string; filters: FilterList } = {
    sourceId: "sourceB",
    filters: {
      genres: [{ id: "action", name: "Action" }, { id: "comedy", name: "Comedy" }],
      formats: [],
      statuses: [],
      sorts: [{ id: "popular", name: "Populer" }, { id: "latest", name: "Terbaru" }]
    }
  };

  describe("mergeFilters", () => {
    it("should union filters and track supported sources", () => {
      const merged = mergeFilters([sourceA, sourceB]);

      expect(merged.genres).toHaveLength(3); // action, romance, comedy

      const action = merged.genres.find(g => g.id === "action");
      expect(action?.supportedBy).toEqual(["sourceA", "sourceB"]);

      const romance = merged.genres.find(g => g.id === "romance");
      expect(romance?.supportedBy).toEqual(["sourceA"]);

      const comedy = merged.genres.find(g => g.id === "comedy");
      expect(comedy?.supportedBy).toEqual(["sourceB"]);
    });

    it("should handle empty filters gracefully", () => {
      const merged = mergeFilters([{ sourceId: "empty", filters: { genres: [], formats: [], statuses: [], sorts: [] } }]);
      expect(merged.genres).toHaveLength(0);
    });

    it("removes catch-alls, localizes sorts while preserving upstream IDs, and prunes compound genres", () => {
      const merged = mergeFilters([
        {
          sourceId: "src1",
          filters: {
            genres: [
              { id: "action", name: "Action" },
              { id: "adventure", name: "Adventure" },
              { id: "fantasy", name: "Fantasy" },
              { id: "action-adventure-fantasy", name: "Action Adventure Fantasy" },
              { id: "school-life", name: "School Life" },
              { id: "webtoons", name: "Webtoons" },
              { id: "apocalypse", name: "apocalypse" },
            ],
            formats: [
              { id: "all", name: "All Types" },
              { id: "manhwa", name: "Manhwa" },
            ],
            statuses: [
              { id: "all-status", name: "Semua Status" },
              { id: "ongoing", name: "Ongoing" },
            ],
            sorts: [
              { id: "update", name: "Latest Update" },
              { id: "highest_rating", name: "Highest Rating" },
              { id: "az", name: "A-Z" },
            ],
          },
        },
        {
          sourceId: "src2",
          filters: {
            genres: [
              { id: "school", name: "School" },
              { id: "webtoon", name: "Webtoon" },
            ],
            formats: [],
            statuses: [],
            sorts: [{ id: "latest", name: "Terbaru" }],
          },
        },
      ]);

      expect(merged.formats.map((f) => f.id)).toEqual(["manhwa"]);
      expect(merged.statuses.map((s) => s.id)).toEqual(["ongoing"]);

      const genreIds = merged.genres.map((g) => g.id);
      expect(genreIds).not.toContain("action-adventure-fantasy");
      expect(genreIds).toContain("school");
      expect(genreIds).toContain("webtoon");
      expect(merged.genres.find((g) => g.id === "apocalypse")?.label).toBe("Apocalypse");

      expect(merged.sorts.map((s) => [s.id, s.label])).toEqual([
        ["latest", "Terbaru"],
        ["rating", "Rating Tertinggi"],
        ["alphabetical", "A-Z"],
      ]);

      const payload1 = buildPayloadForSource("src1", merged, {
        genres: ["school"],
        formats: [],
        status: "",
        sort: "latest",
      });
      expect(payload1["genre[]"]).toEqual(["school-life"]);
      expect(payload1["sort"]).toBe("update");

      const payload2 = buildPayloadForSource("src2", merged, {
        genres: ["school"],
        formats: [],
        status: "",
        sort: "latest",
      });
      expect(payload2["genre[]"]).toEqual(["school"]);
      expect(payload2["sort"]).toBe("latest");
    });
  });

  describe("pruneUnsupportedFilters", () => {
    it("should keep filters supported by at least one active source", () => {
      const merged = mergeFilters([sourceA, sourceB]);
      const pruned = pruneUnsupportedFilters(["action", "romance", "horror"], merged.genres);
      expect(pruned).toEqual(["action", "romance"]); // horror is dropped
    });
  });

  describe("buildPayloadForSource", () => {
    it("should build payload containing only supported filters for the source", () => {
      const merged = mergeFilters([sourceA, sourceB]);
      const activeFilters = {
        genres: ["action", "romance", "comedy"],
        formats: ["manga"],
        status: "ongoing",
        sort: "popular"
      };

      const payloadA = buildPayloadForSource("sourceA", merged, activeFilters);
      expect(payloadA["genre[]"]).toEqual(["action", "romance"]); // comedy excluded
      expect(payloadA["format[]"]).toEqual(["manga"]);
      expect(payloadA["status"]).toBe("ongoing");
      expect(payloadA["sort"]).toBe("popular");

      const payloadB = buildPayloadForSource("sourceB", merged, activeFilters);
      expect(payloadB["genre[]"]).toEqual(["action", "comedy"]); // romance excluded
      expect(payloadB["format[]"]).toBeUndefined(); // manga excluded
      expect(payloadB["status"]).toBeUndefined(); // ongoing excluded
      expect(payloadB["sort"]).toBe("popular");
    });
  });
});
