import { describe, it, expect } from "vitest";
import {
  normalizeTitle,
  matchTitles,
  matchAgainstAlternates,
  rankCandidates,
  isExactNormalizedTitleMatch,
  type TitleCandidate,
} from "../title-matcher";

describe("normalizeTitle", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeTitle("One Piece!")).toBe("one piece");
  });

  it("strips diacritics", () => {
    expect(normalizeTitle("Nausicaä")).toBe("nausicaa");
  });

  it("collapses whitespace", () => {
    expect(normalizeTitle("  Solo   Leveling  ")).toBe("solo leveling");
  });

  it("replaces non-alnum with spaces", () => {
    expect(normalizeTitle("Boku no Hero-Academia")).toBe("boku no hero academia");
  });

  it("preserves non-Latin titles", () => {
    expect(normalizeTitle("나 혼자만 레벨업")).toBe("나 혼자만 레벨업");
    expect(normalizeTitle("進撃の巨人")).toBe("進撃の巨人");
  });

  it("handles null, undefined, and non-string gracefully without throwing", () => {
    expect(normalizeTitle(null)).toBe("");
    expect(normalizeTitle(undefined)).toBe("");
    expect(normalizeTitle("" as any)).toBe("");
    expect(normalizeTitle(123 as any)).toBe("");
  });
});

describe("matchTitles", () => {
  it("returns HIGH_CONFIDENCE for identical normalized titles", () => {
    const result = matchTitles("Solo Leveling", "Solo Leveling");
    expect(result.confidence).toBe("HIGH_CONFIDENCE");
    expect(result.score).toBe(1);
  });

  it("returns HIGH_CONFIDENCE for near-identical titles (punctuation diff)", () => {
    const result = matchTitles("One Piece!", "One Piece");
    expect(result.confidence).toBe("HIGH_CONFIDENCE");
  });

  it("returns HIGH_CONFIDENCE when author also matches", () => {
    const result = matchTitles("Naruto", "Naruto", "Masashi Kishimoto", "Masashi Kishimoto");
    expect(result.confidence).toBe("HIGH_CONFIDENCE");
  });

  it("returns AMBIGUOUS for partial title match", () => {
    const result = matchTitles("Demon King", "Demon King Rising");
    expect(result.confidence).toBe("AMBIGUOUS");
  });

  it("returns NO_MATCH for unrelated titles", () => {
    const result = matchTitles("One Piece", "Bleach");
    expect(result.confidence).toBe("NO_MATCH");
  });

  it("never returns CONFIRMED from heuristics", () => {
    const result = matchTitles("Solo Leveling", "Solo Leveling");
    expect(result.confidence).not.toBe("CONFIRMED");
  });
});

describe("matchAgainstAlternates", () => {
  const candidate: TitleCandidate = {
    sourceId: "src-a",
    mangaId: "m1",
    title: "Solo Leveling",
    alternativeTitles: ["Only I Level Up", "나 혼자만 레벨업"],
  };

  it("matches on primary title", () => {
    const result = matchAgainstAlternates("Solo Leveling", candidate);
    expect(result.confidence).toBe("HIGH_CONFIDENCE");
  });

  it("matches on alternate title", () => {
    const result = matchAgainstAlternates("Only I Level Up", candidate);
    expect(result.confidence).toBe("HIGH_CONFIDENCE");
  });

  it("returns best score across all titles", () => {
    const result = matchAgainstAlternates("Solo Leveling", candidate);
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });
});

describe("rankCandidates", () => {
  const candidates: TitleCandidate[] = [
    { sourceId: "s1", mangaId: "m1", title: "Solo Leveling" },
    { sourceId: "s2", mangaId: "m2", title: "Solo Leveling: Side Stories" },
    { sourceId: "s3", mangaId: "m3", title: "Bleach" },
  ];

  it("filters out NO_MATCH and ranks by score descending", () => {
    const results = rankCandidates("Solo Leveling", candidates);
    expect(results.length).toBe(2); // Bleach filtered out
    expect(results[0].candidate.mangaId).toBe("m1"); // exact match first
  });

  it("returns empty array when no candidates match", () => {
    const results = rankCandidates("Completely Different Title", candidates);
    expect(results.length).toBe(0);
  });
});


describe("isExactNormalizedTitleMatch", () => {
  it("accepts exact normalized primary or alternate titles", () => {
    expect(isExactNormalizedTitleMatch("One Piece!", "One Piece")).toBe(true);
    expect(
      isExactNormalizedTitleMatch("Only I Level Up", "Solo Leveling", [
        "Only I Level Up",
        "나 혼자만 레벨업",
      ])
    ).toBe(true);
  });

  it("rejects merely similar or neighboring titles", () => {
    expect(
      isExactNormalizedTitleMatch(
        "Solo Leveling",
        "Solo Leveling: Side Story"
      )
    ).toBe(false);
    expect(isExactNormalizedTitleMatch("Naruto", "Naruto Shippuden")).toBe(false);
  });
});
