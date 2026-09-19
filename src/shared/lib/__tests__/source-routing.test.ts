import { describe, it, expect, beforeEach } from "vitest";
import { resolveSourceRoute, rankSourcesByPreference } from "../source-routing";
import { useSettingsStore, DEFAULT_GLOBAL_SOURCE_ORDER, DEFAULT_PREFERRED_LANGUAGES } from "@/shared/store/settings-store";
import type { ChapterMeta } from "../chapter-parser";

describe("Phase 6 — Source Preference & Smart Routing", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      routingMode: "PREFERRED",
      globalSourceOrder: DEFAULT_GLOBAL_SOURCE_ORDER,
      preferredLanguages: DEFAULT_PREFERRED_LANGUAGES,
      perTitleSourcePreferences: {},
    });
  });

  const mockSavedTitle = {
    id: "saved-frieren-123",
    title: "Sousou no Frieren",
    author: "Kanehito Yamada",
    primarySourceId: "komiku",
    primaryMangaId: "frieren-indo",
    linkedSources: [
      {
        sourceId: "mangadex",
        mangaId: "frieren-md",
        addedAt: Date.now() - 10000,
        matchConfidence: "CONFIRMED" as const,
      },
      {
        sourceId: "komikindo",
        mangaId: "frieren-indo-kmd",
        addedAt: Date.now() - 5000,
        matchConfidence: "HIGH_CONFIDENCE" as const,
      },
      {
        sourceId: "asurascans",
        mangaId: "frieren-asura",
        addedAt: Date.now() - 2000,
        matchConfidence: "AMBIGUOUS" as const,
      },
    ],
    lastReadChapterTitle: "Chapter 100",
    lastReadChapterNumber: 100,
  };

  const targetChaptersMap: Record<string, ChapterMeta[]> = {
    mangadex: [
      { chapterId: "md-102", chapterNumber: 102, title: "Chapter 102" },
      { chapterId: "md-101", chapterNumber: 101, title: "Chapter 101" },
      { chapterId: "md-100", chapterNumber: 100, title: "Chapter 100" },
    ],
    komikindo: [
      { chapterId: "kmd-100", chapterNumber: 100, title: "Chapter 100" },
    ],
  };

  it("1. explicit per-title source overrides global order and primary source", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      perTitleSourcePreference: "mangadex",
      routingMode: "PREFERRED",
      healthMap: {
        mangadex: { status: "HEALTHY", latencyMs: 500 },
        komiku: { status: "HEALTHY", latencyMs: 50 },
      },
    });

    expect(result.selectedSourceId).toBe("mangadex");
    expect(result.ruleApplied).toBe("EXPLICIT_PER_TITLE");
    expect(result.isTemporary).toBe(false);
    expect(result.requiresUserConfirmation).toBe(false);
  });

  it("2. latency NEVER overrides explicit user source choice", () => {
    // Primary/preferred source has high latency (800ms), other source is super fast (20ms)
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      requestedSourceId: "komiku",
      routingMode: "AUTO_SAFE",
      healthMap: {
        komiku: { status: "HEALTHY", latencyMs: 800 },
        mangadex: { status: "HEALTHY", latencyMs: 20 },
      },
    });

    expect(result.selectedSourceId).toBe("komiku");
    expect(result.ruleApplied).toBe("EXPLICIT_PER_TITLE");
    expect(result.isTemporary).toBe(false);
  });

  it("3. MANUAL mode never silently switches source when broken", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "MANUAL",
      healthMap: {
        komiku: { status: "BROKEN", errorCode: "SOURCE_BROKEN" },
        mangadex: { status: "HEALTHY" },
      },
      targetChaptersMap,
    });

    // In MANUAL mode, hold the preferred source
    expect(result.selectedSourceId).toBe("komiku");
    expect(result.ruleApplied).toBe("FALLBACK_MANUAL_HOLD");
    expect(result.requiresUserConfirmation).toBe(true);
    // Provides fallback candidate as suggestion only
    expect(result.fallbackResult?.candidate?.sourceId).toBe("mangadex");
  });

  it("4. MANUAL mode never silently switches source when rate limited", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "MANUAL",
      healthMap: {
        komiku: { status: "RATE_LIMITED" },
        mangadex: { status: "HEALTHY" },
      },
      targetChaptersMap,
    });

    expect(result.selectedSourceId).toBe("komiku");
    expect(result.ruleApplied).toBe("FALLBACK_MANUAL_HOLD");
    expect(result.requiresUserConfirmation).toBe(true);
  });

  it("5. PREFERRED mode uses temporary fallback for rate limit without permanently relinking", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "PREFERRED",
      healthMap: {
        komiku: { status: "RATE_LIMITED" },
        mangadex: { status: "HEALTHY" },
      },
      targetChaptersMap,
    });

    expect(result.selectedSourceId).toBe("mangadex");
    expect(result.selectedMangaId).toBe("frieren-md");
    expect(result.ruleApplied).toBe("FALLBACK_AUTO_SAFE");
    expect(result.isTemporary).toBe(true); // Temporary fallback
    expect(result.requiresUserConfirmation).toBe(false);
    expect(result.suggestedChapterId).toBe("md-100");
  });

  it("6. PREFERRED mode uses temporary fallback for broken source without permanently relinking", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "PREFERRED",
      healthMap: {
        komiku: { status: "BROKEN", errorCode: "PARSER_BROKEN" },
        mangadex: { status: "HEALTHY" },
      },
      targetChaptersMap,
    });

    expect(result.selectedSourceId).toBe("mangadex");
    expect(result.isTemporary).toBe(true); // Must remain temporary in PREFERRED mode
    expect(result.requiresUserConfirmation).toBe(false);
  });

  it("7. AUTO_SAFE mode allows permanent migration for broken source with exact match", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "AUTO_SAFE",
      healthMap: {
        komiku: { status: "BROKEN", errorCode: "ROUTE_CHANGED" },
        mangadex: { status: "HEALTHY" },
      },
      targetChaptersMap,
    });

    expect(result.selectedSourceId).toBe("mangadex");
    expect(result.isTemporary).toBe(false); // Permanent migration allowed
    expect(result.requiresUserConfirmation).toBe(false);
    expect(result.suggestedChapterId).toBe("md-100");
  });

  it("8. AUTO_SAFE mode requires confirmation when chapter match is ambiguous", () => {
    const incompleteChaptersMap: Record<string, ChapterMeta[]> = {
      mangadex: [
        { chapterId: "md-1", chapterNumber: 1, title: "Chapter 1" },
        { chapterId: "md-50", chapterNumber: 50, title: "Chapter 50" },
      ],
    };

    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle, // User was at ch 100
      routingMode: "AUTO_SAFE",
      healthMap: {
        komiku: { status: "BROKEN", errorCode: "PARSER_BROKEN" },
        mangadex: { status: "HEALTHY" },
      },
      targetChaptersMap: incompleteChaptersMap,
    });

    expect(result.selectedSourceId).toBe("komiku");
    expect(result.requiresUserConfirmation).toBe(true);
    expect(result.ruleApplied).toBe("FALLBACK_SUGGESTION");
  });

  it("9. DOMAIN_CHANGED resolves domain first without immediately abandoning source", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "AUTO_SAFE",
      healthMap: {
        komiku: {
          status: "DOMAIN_CHANGED",
          resolvedHost: "komiku.id",
        },
      },
    });

    expect(result.selectedSourceId).toBe("komiku");
    expect(result.domainResolutionRequired).toBe(true);
    expect(result.resolvedHost).toBe("komiku.id");
    expect(result.isTemporary).toBe(false);
  });

  it("10. UNKNOWN health status does not trigger speculative migration", () => {
    const result = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "AUTO_SAFE",
      healthMap: {
        komiku: { status: "UNKNOWN" },
      },
      targetChaptersMap,
    });

    expect(result.selectedSourceId).toBe("komiku");
    expect(result.isTemporary).toBe(false);
    expect(result.requiresUserConfirmation).toBe(false);
  });

  it("11. rankSourcesByPreference prioritizes language and global order over latency", () => {
    const ranked = rankSourcesByPreference({
      candidateSourceIds: ["asurascans", "mangadex", "komiku"],
      globalSourceOrder: ["komiku", "mangadex", "asurascans"],
      languagePreference: ["id", "en"],
      healthMap: {
        // Asura is super low latency (10ms) but language is 'en'
        asurascans: { status: "HEALTHY", latencyMs: 10 },
        // Komiku is 'id' and top of globalSourceOrder (150ms)
        komiku: { status: "HEALTHY", latencyMs: 150 },
        // Mangadex is 'multi' (200ms)
        mangadex: { status: "HEALTHY", latencyMs: 200 },
      },
    });

    // komiku (id) should outrank asurascans (en) despite higher latency
    expect(ranked[0]).toBe("komiku");
  });

  it("12. user preferences persist in settings store correctly", () => {
    const store = useSettingsStore.getState();

    store.setRoutingMode("AUTO_SAFE");
    expect(useSettingsStore.getState().routingMode).toBe("AUTO_SAFE");

    store.setPerTitleSourcePreference("saved-frieren-123", "mangadex");
    expect(useSettingsStore.getState().perTitleSourcePreferences["saved-frieren-123"]).toBe("mangadex");

    store.clearPerTitleSourcePreference("saved-frieren-123");
    expect(useSettingsStore.getState().perTitleSourcePreferences["saved-frieren-123"]).toBeUndefined();
  });

  it("13. routing result is completely deterministic", () => {
    const run1 = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "PREFERRED",
      healthMap: { komiku: { status: "RATE_LIMITED" }, mangadex: { status: "HEALTHY" } },
      targetChaptersMap,
    });

    const run2 = resolveSourceRoute({
      savedTitle: mockSavedTitle,
      routingMode: "PREFERRED",
      healthMap: { komiku: { status: "RATE_LIMITED" }, mangadex: { status: "HEALTHY" } },
      targetChaptersMap,
    });

    expect(run1).toEqual(run2);
  });
});
