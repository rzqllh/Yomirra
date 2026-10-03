import { describe, expect, it } from "vitest";
import {
  buildRecommendationProfile,
  rankRecommendationCandidates,
  type RecommendationCandidate,
} from "../recommendations";

const candidate = (
  id: string,
  title: string,
  sourceId = "source-a",
  extra: Partial<RecommendationCandidate["manga"]> = {}
): RecommendationCandidate => ({
  sourceId,
  manga: {
    id,
    title,
    coverUrl: "",
    ...extra,
  },
});

describe("deterministic recommendations", () => {
  it("keeps already-read and saved titles out of new recommendations", () => {
    const profile = buildRecommendationProfile(
      [{ sourceId: "source-a", title: "Saved Manga", format: "Manhwa" }],
      [{
        sourceId: "source-b",
        mangaId: "read-1",
        mangaTitle: "Read Manga",
        readAt: 100,
      }]
    );

    const ranked = rankRecommendationCandidates(
      [
        candidate("current", "Current Manga"),
        candidate("saved", "Saved Manga"),
        candidate("read", "Read Manga"),
        candidate("new", "New Manga"),
      ],
      {
        currentTitle: "Current Manga",
        currentSourceId: "source-a",
        profile,
      }
    );

    expect(ranked.map((item) => item.manga.id)).toEqual(["new"]);
  });

  it("uses local source and format preferences without an AI score", () => {
    const profile = buildRecommendationProfile(
      [
        {
          sourceId: "source-b",
          title: "Favorite One",
          format: "Manhwa",
          userRating: 10,
        },
        {
          sourceId: "source-b",
          title: "Favorite Two",
          format: "Manhwa",
          userRating: 9,
        },
      ],
      []
    );

    const ranked = rankRecommendationCandidates(
      [
        candidate("plain", "Plain", "source-c", { format: "Manga", score: 9.8 }),
        candidate("preferred", "Preferred", "source-b", { format: "Manhwa", score: 7.5 }),
      ],
      {
        currentTitle: "Current",
        currentSourceId: "source-a",
        currentFormat: "Manhwa",
        profile,
      }
    );

    expect(ranked[0].manga.id).toBe("preferred");
  });

  it("keeps discovery order stable when scores tie", () => {
    const profile = buildRecommendationProfile([], []);

    const ranked = rankRecommendationCandidates(
      [
        candidate("first", "First"),
        candidate("second", "Second"),
      ],
      {
        currentTitle: "Current",
        currentSourceId: "other-source",
        profile,
      }
    );

    expect(ranked.map((item) => item.manga.id)).toEqual(["first", "second"]);
  });

  it("counts only the latest history entry per title for source preference", () => {
    const profile = buildRecommendationProfile(
      [],
      [
        { sourceId: "source-a", mangaId: "m1", mangaTitle: "One", readAt: 10 },
        { sourceId: "source-a", mangaId: "m1", mangaTitle: "One", readAt: 20 },
        { sourceId: "source-b", mangaId: "m2", mangaTitle: "Two", readAt: 30 },
      ]
    );

    expect(profile.sourceWeights.get("source-a")).toBeCloseTo(0.975);
    expect(profile.sourceWeights.get("source-b")).toBeCloseTo(1);
  });

  it("ranks genre-matched titles above genre-mismatched titles of equal rating", () => {
    const profile = buildRecommendationProfile([], []);

    const ranked = rankRecommendationCandidates(
      [
        candidate("no-match", "No Genre Match", "source-b", { genres: ["Sports", "Comedy"] }),
        candidate("full-match", "Full Genre Match", "source-b", {
          genres: ["Action", "Fantasy", "Adventure"],
        }),
        candidate("partial-match", "Partial Genre Match", "source-c", {
          genres: ["Action", "Sports"],
        }),
      ],
      {
        currentTitle: "Current",
        currentSourceId: "source-a",
        currentGenres: ["Action", "Fantasy", "Adventure"],
        profile,
      }
    );

    expect(ranked[0].manga.id).toBe("full-match");
    expect(ranked[1].manga.id).toBe("partial-match");
    expect(ranked[2].manga.id).toBe("no-match");
  });

  it("genre overlap beats same-source bias for cross-source discovery", () => {
    const profile = buildRecommendationProfile([], []);

    const ranked = rankRecommendationCandidates(
      [
        candidate("same-source-different-genre", "Same Source", "source-a", {
          genres: ["Sports", "Slice of Life"],
        }),
        candidate("other-source-matching-genre", "Other Source Match", "source-b", {
          genres: ["Action", "Adventure", "Fantasy"],
        }),
      ],
      {
        currentTitle: "Current",
        currentSourceId: "source-a",
        currentGenres: ["Action", "Adventure", "Fantasy"],
        profile,
      }
    );

    expect(ranked[0].manga.id).toBe("other-source-matching-genre");
  });

  it("handles empty currentGenres gracefully without crashing", () => {
    const profile = buildRecommendationProfile([], []);

    const ranked = rankRecommendationCandidates(
      [
        candidate("a", "Manga A"),
        candidate("b", "Manga B"),
      ],
      {
        currentTitle: "Current",
        currentSourceId: "other-source",
        currentGenres: [],
        profile,
      }
    );

    expect(ranked.map((item) => item.manga.id)).toEqual(["a", "b"]);
  });
});

