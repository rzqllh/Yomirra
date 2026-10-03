import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock site config
vi.mock("@/server/lib/site/site-config-service", () => ({
  getSiteConfig: vi.fn(),
}));

// Mock gemini embeddings
vi.mock("@/server/lib/search/gemini-embeddings", () => ({
  isSemanticEmbeddingConfigured: vi.fn(() => true),
  embedSearchText: vi.fn(),
  cosineSimilarity: vi.fn(() => 0.85),
}));

// Mock semantic-catalog
vi.mock("@/server/lib/search/semantic-catalog", () => ({
  getRecentSearchCatalogRecords: vi.fn(async () => []),
  getSearchCatalogRecord: vi.fn(async () => null),
  hashEmbeddingText: vi.fn(() => "mock-hash"),
  upsertSearchCatalogRecords: vi.fn(async () => {}),
}));

import { getSiteConfig } from "@/server/lib/site/site-config-service";
import { embedSearchText } from "@/server/lib/search/gemini-embeddings";
import { rankSearchIntelligence } from "@/server/lib/search/search-intelligence-service";
import { resolveSourceRoute } from "@/shared/lib/source-routing";
import { sendTelegramMessage } from "@/server/lib/ops/telegram-notifier";
import { AlertSeverity } from "@/server/lib/ops/severity";
import { resolveEffectiveDataSaver } from "@/shared/store/settings-store";
import { env } from "@/env";

describe("Runtime Feature Flags (Phase J)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSiteConfig = (features: any) => ({
    announcement: { id: "ann-test", enabled: false, message: "", type: "info" as const },
    maintenanceMode: { enabled: false, message: "" },
    spotlight: { pinnedManga: [] },
    features,
    updatedAt: new Date().toISOString(),
  });

  describe("J1: Semantic Search Guard", () => {
    it("bypasses Gemini embedding calls when semanticSearchEnabled is false", async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        mockSiteConfig({
          semanticSearchEnabled: false,
          sourceFallbackAutoSwitch: true,
          telegramAlertsEnabled: true,
          dataSaverDefault: false,
        })
      );

      const result = await rankSearchIntelligence({
        query: "solo hunter leveling in dungeon",
        tags: [],
        candidates: [
          {
            canonicalKey: "solo-leveling",
            sourceId: "asurascans",
            mangaId: "solo-leveling",
            title: "Solo Leveling",
          },
        ],
      });

      expect(embedSearchText).not.toHaveBeenCalled();
      expect(result.semanticAvailable).toBe(false);
      expect(result.catalogMatches).toBeDefined();
    });

    it("executes Gemini embedding calls when semanticSearchEnabled is true", async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        mockSiteConfig({
          semanticSearchEnabled: true,
          sourceFallbackAutoSwitch: true,
          telegramAlertsEnabled: true,
          dataSaverDefault: false,
        })
      );
      vi.mocked(embedSearchText).mockResolvedValue([0.1, 0.2, 0.3]);

      const result = await rankSearchIntelligence({
        query: "solo hunter leveling in dungeon",
        tags: [],
        candidates: [
          {
            canonicalKey: "solo-leveling",
            sourceId: "asurascans",
            mangaId: "solo-leveling",
            title: "Solo Leveling",
          },
        ],
      });

      expect(embedSearchText).toHaveBeenCalled();
      expect(result.semanticAvailable).toBe(true);
    });
  });

  describe("J2: Auto Source Fallback Guard", () => {
    it("holds current source with confirmation when sourceFallbackAutoSwitch is false", () => {
      const result = resolveSourceRoute({
        savedTitle: {
          id: "manga-1",
          title: "One Piece",
          primarySourceId: "komiku",
          primaryMangaId: "one-piece",
          linkedSources: [
            { sourceId: "komikindo", mangaId: "one-piece-indo", addedAt: 1700000000000, matchConfidence: "CONFIRMED" },
          ],
        },
        healthMap: {
          komiku: { status: "BROKEN", errorCode: "SOURCE_DOWN" },
        },
        routingMode: "AUTO_SAFE",
        sourceFallbackAutoSwitch: false,
      });

      expect(result.selectedSourceId).toBe("komiku");
      expect(result.ruleApplied).toBe("FALLBACK_MANUAL_HOLD");
      expect(result.requiresUserConfirmation).toBe(true);
    });
  });

  describe("J3: Telegram Alerts Guard", () => {
    it("suppresses automatic alerts when telegramAlertsEnabled is false", async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        mockSiteConfig({
          semanticSearchEnabled: true,
          sourceFallbackAutoSwitch: true,
          telegramAlertsEnabled: false,
          dataSaverDefault: false,
        })
      );

      const sent = await sendTelegramMessage("Upstream error", {
        severity: AlertSeverity.WARNING,
        fingerprint: "test-err",
      });

      expect(sent).toBe(false);
    });

    it("allows manual admin test even when telegramAlertsEnabled is false", async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        mockSiteConfig({
          semanticSearchEnabled: true,
          sourceFallbackAutoSwitch: true,
          telegramAlertsEnabled: false,
          dataSaverDefault: false,
        })
      );

      // env check: if tokens are missing in test env, it returns false at token guard, not config guard
      const origToken = env.TELEGRAM_BOT_TOKEN;
      const origChat = env.TELEGRAM_CHAT_ID;
      (env as any).TELEGRAM_BOT_TOKEN = "mock-token";
      (env as any).TELEGRAM_CHAT_ID = "mock-chat";

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      } as any);

      const sent = await sendTelegramMessage("Manual Admin Test", {
        severity: AlertSeverity.INFO,
        fingerprint: "manual-test",
        isManualTest: true,
      });

      expect(sent).toBe(true);

      (env as any).TELEGRAM_BOT_TOKEN = origToken;
      (env as any).TELEGRAM_CHAT_ID = origChat;
      fetchSpy.mockRestore();
    });
  });

  describe("J4: Data Saver Default Precedence", () => {
    it("respects explicit user setting over site default", () => {
      expect(resolveEffectiveDataSaver(true, false, false)).toBe(true);
      expect(resolveEffectiveDataSaver(false, true, false)).toBe(false);
    });

    it("uses site default when user setting is not set", () => {
      expect(resolveEffectiveDataSaver(undefined, true, false)).toBe(true);
      expect(resolveEffectiveDataSaver(null, true, false)).toBe(true);
      expect(resolveEffectiveDataSaver(undefined, false, true)).toBe(false);
    });

    it("uses hardcoded fallback when neither user nor site default is set", () => {
      expect(resolveEffectiveDataSaver(undefined, undefined, false)).toBe(false);
      expect(resolveEffectiveDataSaver(undefined, undefined, true)).toBe(true);
    });
  });
});
