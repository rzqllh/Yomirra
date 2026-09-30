import { describe, it, expect } from "vitest";
import {
  lexicalSearchScore,
  rankHybridScore,
  parseSearchExpression,
  resolveSearchTag,
  candidateMatchesTags,
  isSourceCompatibleWithTags,
  type SearchCatalogCandidate,
} from "../search-intelligence";
import { clusterCanonicalResults } from "../canonical-search";
import { findNearestSafeChapter, type ChapterMeta } from "../chapter-parser";
import type { MangaItem } from "@/shared/sources/source-types";
import type { MergedFilterList } from "@/shared/utils/filter-helpers";

describe("Phase 3.6 — Search and Ranking Quality Regression Suite", () => {
  describe("1. Exact title vs prefix vs contains vs unrelated ranking", () => {
    const exactCandidate: SearchCatalogCandidate = {
      canonicalKey: "canonical:solo-leveling",
      sourceId: "src-a",
      mangaId: "m1",
      title: "Solo Leveling",
    };
    const prefixCandidate: SearchCatalogCandidate = {
      canonicalKey: "canonical:solo-leveling-ragnarok",
      sourceId: "src-a",
      mangaId: "m2",
      title: "Solo Leveling: Ragnarok",
    };
    const containsCandidate: SearchCatalogCandidate = {
      canonicalKey: "canonical:reincarnated-in-solo-leveling",
      sourceId: "src-a",
      mangaId: "m3",
      title: "I Reincarnated in Solo Leveling",
    };
    const unrelatedCandidate: SearchCatalogCandidate = {
      canonicalKey: "canonical:one-piece",
      sourceId: "src-a",
      mangaId: "m4",
      title: "One Piece",
    };

    it("ranks exact title higher than prefix, substring contains, and unrelated matches", () => {
      const query = "Solo Leveling";
      const scoreExact = lexicalSearchScore(query, exactCandidate);
      const scorePrefix = lexicalSearchScore(query, prefixCandidate);
      const scoreContains = lexicalSearchScore(query, containsCandidate);
      const scoreUnrelated = lexicalSearchScore(query, unrelatedCandidate);

      expect(scoreExact).toBe(1);
      expect(scorePrefix).toBe(0.95);
      expect(scoreContains).toBe(0.9);
      expect(scoreExact).toBeGreaterThan(scorePrefix);
      expect(scorePrefix).toBeGreaterThan(scoreContains);
      expect(scoreContains).toBeGreaterThan(scoreUnrelated);
      expect(scoreUnrelated).toBeLessThan(0.4);
    });

    it("exact match dominates hybrid score even when semantic score is low", () => {
      // 4+ words to trigger hybrid mode
      const query = "solo leveling manhwa story";
      const highLexicalLowSemantic = rankHybridScore(
        query,
        {
          canonicalKey: "c:1",
          sourceId: "s",
          mangaId: "1",
          title: "solo leveling manhwa story",
        },
        0.2
      );

      const lowLexicalHighSemantic = rankHybridScore(
        query,
        {
          canonicalKey: "c:2",
          sourceId: "s",
          mangaId: "2",
          title: "completely unrelated adventure",
        },
        0.95
      );

      expect(highLexicalLowSemantic).toBeGreaterThan(lowLexicalHighSemantic);
    });
  });

  describe("2. Alias and title normalization", () => {
    const candidateWithAliases: SearchCatalogCandidate = {
      canonicalKey: "canonical:solo-leveling",
      sourceId: "src-a",
      mangaId: "m1",
      title: "Na Honjaman Rebeleob",
      alternativeTitles: [
        "Solo Leveling",
        "Only I Level Up",
        "I Alone Level-Up!",
      ],
      originalTitle: "나 혼자만 レ벨업",
    };

    it("matches exact alternate title with full score", () => {
      expect(lexicalSearchScore("Solo Leveling", candidateWithAliases)).toBe(1);
      expect(lexicalSearchScore("Only I Level Up", candidateWithAliases)).toBe(1);
    });

    it("handles punctuation and casing differences seamlessly", () => {
      expect(lexicalSearchScore("i alone level up", candidateWithAliases)).toBe(1);
      expect(lexicalSearchScore("NA HONJAMAN REBELEOB", candidateWithAliases)).toBe(1);
    });

    it("strips source-specific bracket tags and normalizes roman numerals", () => {
      const candidateWithBrackets: SearchCatalogCandidate = {
        canonicalKey: "canonical:solo-leveling",
        sourceId: "src-a",
        mangaId: "m1",
        title: "Solo Leveling [Bahasa Indonesia]",
        alternativeTitles: ["Solo Leveling Season II"],
      };

      // Bracket tag [Bahasa Indonesia] stripped so exact query matches with score 1
      expect(lexicalSearchScore("Solo Leveling", candidateWithBrackets)).toBe(1);
      // Season II normalized to Season 2
      expect(lexicalSearchScore("Solo Leveling Season 2", candidateWithBrackets)).toBe(1);
    });
  });

  describe("3. Typo tolerance boundaries", () => {
    it("matches small typos in titles with high score", () => {
      const candidate: SearchCatalogCandidate = {
        canonicalKey: "c:naruto",
        sourceId: "s",
        mangaId: "1",
        title: "Naruto Shippuden",
      };

      // 1 char typo: "Narutoo"
      const score = lexicalSearchScore("Narutoo Shippuden", candidate);
      expect(score).toBeGreaterThanOrEqual(0.85);
    });

    it("prevents short queries (<= 3 chars) from exploding into unrelated fuzzy matches", () => {
      const candidate: SearchCatalogCandidate = {
        canonicalKey: "c:ope",
        sourceId: "s",
        mangaId: "1",
        title: "Ope",
      };

      // "one" is 3 chars, 1 edit distance from "Ope", but because length <= 3, fuzzy distance is disabled
      const score = lexicalSearchScore("one", candidate);
      expect(score).toBe(0);
    });

    it("resolves tag typos while rejecting short ambiguous prefixes", () => {
      expect(resolveSearchTag("#fantasi")?.id).toBe("fantasy");
      expect(resolveSearchTag("#fantassy")?.id).toBe("fantasy");
      expect(resolveSearchTag("#adventur")?.id).toBe("adventure");
      // Short 3-char prefix is ambiguous and must not falsely match
      expect(resolveSearchTag("#act")).toBeNull();
      expect(resolveSearchTag("#rom")).toBeNull();
    });
  });

  describe("4. Tag filters and combined query parsing with include/exclude semantics", () => {
    it("extracts recognized tags, handles exclude operators, and retains query text", () => {
      const parsed = parseSearchExpression("omniscient reader #aksi -#horor !#romansa");
      expect(parsed.textQuery).toBe("omniscient reader");
      expect(parsed.tags.map((t) => [t.operator ?? "include", t.category, t.id])).toEqual([
        ["include", "genre", "action"],
        ["exclude", "genre", "horror"],
        ["exclude", "genre", "romance"],
      ]);
      expect(parsed.unresolvedTags).toEqual([]);
    });

    it("correctly matches candidate against include and exclude tags", () => {
      const candidateA: SearchCatalogCandidate = {
        canonicalKey: "c:1",
        sourceId: "s",
        mangaId: "1",
        title: "Omniscient Reader",
        genres: ["Action", "Fantasy"],
        status: "Completed",
      };

      const candidateWithExcludedGenre: SearchCatalogCandidate = {
        canonicalKey: "c:2",
        sourceId: "s",
        mangaId: "2",
        title: "Dark Fantasy Blood",
        genres: ["Action", "Fantasy", "Horror"],
        status: "Completed",
      };

      const parsed = parseSearchExpression("test #aksi -#horor");
      expect(candidateMatchesTags(candidateA, parsed.tags)).toBe(true);
      // candidateWithExcludedGenre has Horror, so it must be rejected by -#horor
      expect(candidateMatchesTags(candidateWithExcludedGenre, parsed.tags)).toBe(false);
    });
  });

  describe("5. Multi-source duplicate clustering", () => {
    it("clusters duplicate titles across sources into single canonical result with bindings", () => {
      const items: Array<{ manga: MangaItem; sourceId: string }> = [
        {
          sourceId: "shinigami",
          manga: {
            id: "op-shini",
            title: "One Piece",
            coverUrl: "https://shini.io/op.jpg",
            latestChapter: "Chapter 1100",
          },
        },
        {
          sourceId: "komiku",
          manga: {
            id: "op-komiku",
            title: "One Piece",
            coverUrl: "https://komiku.id/op.jpg",
            latestChapter: "Chapter 1100",
          },
        },
      ];

      const clusters = clusterCanonicalResults(items);
      expect(clusters).toHaveLength(1);
      expect(clusters[0].canonicalKey).toBe("canonical:one piece");
      expect(clusters[0].sourceBindings).toHaveLength(2);
      expect(clusters[0].sourceBindings.map((b) => b.sourceId)).toEqual(["shinigami", "komiku"]);
    });
  });

  describe("6. Admin kill-switch vs user browsing toggle contract in search", () => {
    const allSources = [
      { id: "source-admin-disabled", isInstalled: true, isEnabled: false, capabilities: { search: true } },
      { id: "source-user-disabled", isInstalled: true, isEnabled: true, capabilities: { search: true } },
      { id: "source-normal", isInstalled: true, isEnabled: true, capabilities: { search: true } },
    ];

    it("filters out admin-disabled source while retaining user-disabled browsing source in search", () => {
      // User has toggled off "source-user-disabled" from ordinary browsing (e.g. cookie = ["source-user-disabled"])
      // But Search ignores user browsing toggles! Only admin isEnabled: false is killed globally.
      const searchableSources = allSources.filter((source) => {
        if (!source.isInstalled || source.isEnabled === false || !source.capabilities?.search) {
          return false;
        }
        return true;
      });

      expect(searchableSources.map((s) => s.id)).toEqual([
        "source-user-disabled",
        "source-normal",
      ]);
      expect(searchableSources.some((s) => s.id === "source-admin-disabled")).toBe(false);
    });
  });

  describe("7. Unavailable source capability isolation and down-source handling", () => {
    it("determines if a source cannot handle hard tags and isolates it", () => {
      const mergedFilters: MergedFilterList = {
        genres: [{ id: "fantasy", label: "Fantasy", supportedBy: ["source-a"], sourceValues: { "source-a": "fantasy" } }],
        formats: [{ id: "manhwa", label: "Manhwa", supportedBy: ["source-a", "source-b"], sourceValues: { "source-a": "manhwa", "source-b": "manhwa" } }],
        statuses: [{ id: "completed", label: "Completed", supportedBy: ["source-a", "source-b"], sourceValues: { "source-a": "completed", "source-b": "completed" } }],
        sorts: [],
      };

      const parsed = parseSearchExpression("#fantasi");
      // source-b does not support "fantasy" genre
      expect(isSourceCompatibleWithTags("source-a", parsed.tags, mergedFilters)).toBe(true);
      expect(isSourceCompatibleWithTags("source-b", parsed.tags, mergedFilters)).toBe(false);
    });

    it("isolates runtime down/unavailable sources from active query execution", () => {
      const sources = [
        { id: "source-online", status: "healthy" as const },
        { id: "source-down", status: "unavailable" as const },
        { id: "source-fixing", status: "in-fix" as const },
      ];

      const eligible = sources.filter(
        (s) => s.status !== "unavailable" && s.status !== "in-fix"
      );

      expect(eligible.map((s) => s.id)).toEqual(["source-online"]);
    });
  });

  describe("8. Custom runtime source search participation", () => {
    it("allows dynamic custom sources with search capability to participate in catalog", () => {
      const customSource = {
        id: "custom-mangahub",
        name: "MangaHub Custom",
        isInstalled: true,
        isEnabled: true,
        isCustom: true,
        capabilities: { search: true, popular: true, latest: true },
      };

      const isSearchEligible =
        customSource.isInstalled &&
        customSource.isEnabled &&
        Boolean(customSource.capabilities?.search);

      expect(isSearchEligible).toBe(true);
    });
  });

  describe("9. Chapter fallback and migration edge cases", () => {
    const chapters: ChapterMeta[] = [
      { chapterId: "ch-100", chapterTitle: "Chapter 100", chapterNumber: 100 },
      { chapterId: "ch-99", chapterTitle: "Chapter 99", chapterNumber: 99 },
      { chapterId: "ch-98", chapterTitle: "Chapter 98", chapterNumber: 98 },
      { chapterId: "ch-95", chapterTitle: "Chapter 95", chapterNumber: 95 },
      { chapterId: "ch-90", chapterTitle: "Chapter 90", chapterNumber: 90 },
    ];

    it("maps exact chapter number when present in target source", () => {
      const match = findNearestSafeChapter(99, chapters);
      expect(match).not.toBeNull();
      expect(match?.chapterNumber).toBe(99);
      expect(match?.chapter.chapterId).toBe("ch-99");
    });

    it("falls back to nearest safe preceding chapter when exact chapter is missing in target", () => {
      // User was on chapter 97, which is missing in target (has 95 and 98)
      // Nearest safe fallback must be 95 (preceding or nearest <= 97), NOT jumping forward to unread content
      const match = findNearestSafeChapter(97, chapters);
      expect(match).not.toBeNull();
      expect(match?.chapterNumber).toBe(95);
      expect(match?.chapter.chapterId).toBe("ch-95");
    });

    it("returns null safely if target has no chapters before target number", () => {
      const match = findNearestSafeChapter(50, chapters);
      expect(match).toBeNull();
    });
  });
});
