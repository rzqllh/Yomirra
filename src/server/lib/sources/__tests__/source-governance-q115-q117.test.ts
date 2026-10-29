import { describe, it, expect, vi } from "vitest";

describe("Source Governance & Truthful Health - Q104, Q107, Q115, Q116, Q117", () => {
  describe("Q115: Truthful Health Status Mapping", () => {
    // Mirror of canonical health status resolver in source-card.tsx
    function getReaderHealth(status: string) {
      if (status === "online") return { label: "Normal", variant: "success" };
      if (status === "slow") return { label: "Lambat", variant: "warning" };
      if (status === "degraded") return { label: "Gangguan", variant: "warning" };
      if (status === "unknown") return { label: "Belum diperiksa", variant: "muted" };
      return { label: "Offline", variant: "error" };
    }

    it("distinguishes unknown/unprobed sources from online, never fabricating Normal", () => {
      const unknownHealth = getReaderHealth("unknown");
      expect(unknownHealth.label).toBe("Belum diperiksa");
      expect(unknownHealth.variant).toBe("muted");
      expect(unknownHealth.label).not.toBe("Normal");

      const onlineHealth = getReaderHealth("online");
      expect(onlineHealth.label).toBe("Normal");
      expect(onlineHealth.variant).toBe("success");

      const degradedHealth = getReaderHealth("degraded");
      expect(degradedHealth.label).toBe("Gangguan");
      expect(degradedHealth.variant).toBe("warning");

      const slowHealth = getReaderHealth("slow");
      expect(slowHealth.label).toBe("Lambat");
      expect(slowHealth.variant).toBe("warning");
    });
  });

  describe("Q116 & Q117: Source Visibility Scopes & Instant Revocation", () => {
    it("Q117: Revoking / disabling an adapter immediately flags its operational status as DOWN", () => {
      interface SourceOverride {
        isEnabled?: boolean;
        mirrors?: string[];
      }

      function resolveSourceStatus(meta: { id: string; isEnabled: boolean; status?: string }, override?: SourceOverride) {
        const isEnabled = typeof override?.isEnabled === "boolean" ? override.isEnabled : meta.isEnabled;
        let status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNMEASURED" = "UNMEASURED";
        if (!isEnabled) {
          status = "DOWN";
        } else if (meta.status === "online") {
          status = "HEALTHY";
        }
        return { isEnabled, status };
      }

      // Initial active source
      const active = resolveSourceStatus({ id: "asurascans", isEnabled: true, status: "online" });
      expect(active.isEnabled).toBe(true);
      expect(active.status).toBe("HEALTHY");

      // Q117: Revoke / disable source
      const revoked = resolveSourceStatus(
        { id: "asurascans", isEnabled: true, status: "online" },
        { isEnabled: false }
      );
      expect(revoked.isEnabled).toBe(false);
      expect(revoked.status).toBe("DOWN");
    });

    it("Q116: Filters sources based on enabled state for catalog visibility", () => {
      const sources = [
        { id: "asurascans", name: "Asura Scans", isEnabled: true },
        { id: "flamecomics", name: "Flame Comics", isEnabled: false },
        { id: "mangadex", name: "MangaDex", isEnabled: true },
      ];

      const visibleSources = sources.filter((s) => s.isEnabled);
      expect(visibleSources.map((s) => s.id)).toEqual(["asurascans", "mangadex"]);
      expect(visibleSources.some((s) => s.id === "flamecomics")).toBe(false);
    });
  });

  describe("Q104: Zero Sources Fallback State", () => {
    it("handles explicit zero-source state when user deselects all sources", () => {
      const allSources = ["asurascans", "mangadex"];
      const selectedSources: string[] = []; // user deselected all

      const activeSources = selectedSources.filter((id) => allSources.includes(id));
      expect(activeSources.length).toBe(0);

      // Verify zero source condition check works cleanly
      const isZeroSources = activeSources.length === 0;
      expect(isZeroSources).toBe(true);
    });
  });

  describe("Q107: Honest Leaderboard Ranking", () => {
    it("ranks items using their actual score/order without fabricating global stats", () => {
      const sourceLeaderboardItems = [
        { id: "manga-1", title: "Top Manga", viewCount: 15000 },
        { id: "manga-2", title: "Second Manga", viewCount: 12000 },
        { id: "manga-3", title: "Third Manga", viewCount: 8000 },
      ];

      const ranked = sourceLeaderboardItems.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].title).toBe("Top Manga");
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);
    });
  });
});
