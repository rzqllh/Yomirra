import { describe, it, expect } from "vitest";
import { getReaderPageLoadState, advanceReaderReveal } from "../reader-load-order";
import { beginNavigationIntent, endNavigationIntent, getNavigationPathname } from "../navigation-intent";

describe("Phase 2 — Core Stability Regression Suite", () => {
  describe("2.2 Navigation Intent & Perceived Performance", () => {
    it("extracts clean pathname from complex links with search params and hash", () => {
      expect(getNavigationPathname("/library?sort=latest#top")).toBe("/library");
      expect(getNavigationPathname("/search?q=solo+leveling")).toBe("/search");
      expect(getNavigationPathname("/")).toBe("/");
      expect(getNavigationPathname("")).toBe("/");
    });

    it("prevents duplicate navigation intent events for the same destination", () => {
      endNavigationIntent();
      expect(beginNavigationIntent("/popular")).toBe(true);
      // Repeated intent while pending returns false
      expect(beginNavigationIntent("/popular")).toBe(false);

      endNavigationIntent();
      // After navigation settles, new intent succeeds
      expect(beginNavigationIntent("/popular")).toBe(true);
      endNavigationIntent();
    });
  });

  describe("2.4 Source Filtering & Search Stale Selection Recovery", () => {
    it("filters out user-disabled browsing sources from active browsing list", () => {
      const allRuntimeSources = [
        { id: "mangadex", isEnabled: true, isInstalled: true, status: "online" },
        { id: "asura", isEnabled: true, isInstalled: true, status: "online" },
        { id: "shinigami", isEnabled: false, isInstalled: true, status: "online" }, // admin killed
        { id: "broken", isEnabled: true, isInstalled: true, status: "unavailable" }, // broken
      ];
      const userDisabledSources = ["asura"];

      const activeBrowsingSources = allRuntimeSources.filter(
        (s) =>
          s.isEnabled &&
          s.isInstalled &&
          s.status !== "unavailable" &&
          !userDisabledSources.includes(s.id)
      );

      // Only mangadex is allowed for home/popular browsing
      expect(activeBrowsingSources.map((s) => s.id)).toEqual(["mangadex"]);
    });

    it("allows user-disabled browsing source in search if runtime-enabled and available", () => {
      const allRuntimeSources = [
        { id: "mangadex", isEnabled: true, isInstalled: true, status: "online", capabilities: { search: true } },
        { id: "asura", isEnabled: true, isInstalled: true, status: "online", capabilities: { search: true } },
        { id: "shinigami", isEnabled: false, isInstalled: true, status: "online", capabilities: { search: true } }, // admin killed
      ];
      // Search ignores user browsing toggle, but strictly obeys admin isEnabled
      const searchableSources = allRuntimeSources.filter((s) => {
        if (!s.isInstalled || s.isEnabled === false || !s.capabilities?.search) return false;
        return true;
      });

      expect(searchableSources.map((s) => s.id)).toEqual(["mangadex", "asura"]);
      expect(searchableSources.map((s) => s.id)).not.toContain("shinigami");
    });

    it("recovers safely to all candidate sources if persisted user selection contains only stale IDs", () => {
      const searchableSources = [
        { id: "mangadex" },
        { id: "asura" },
      ];
      // User's persisted storage had "deleted-custom-source"
      const persistedSelectedSources = ["deleted-custom-source"];

      const filtered = persistedSelectedSources.filter((id) =>
        searchableSources.some((s) => s.id === id)
      );

      const activeSelected = filtered.length > 0 ? filtered : searchableSources.map((s) => s.id);

      expect(activeSelected).toEqual(["mangadex", "asura"]);
    });
  });

  describe("2.5 Reader FIFO Concurrency & Queue Deadlock Prevention", () => {
    it("strictly bounds concurrent requests to windowSize (2)", () => {
      // At start (revealedThrough = -1)
      const state0 = getReaderPageLoadState(0, 0, -1, 2);
      const state1 = getReaderPageLoadState(1, 0, -1, 2);
      const state2 = getReaderPageLoadState(2, 0, -1, 2);

      expect(state0.shouldLoad).toBe(true);
      expect(state1.shouldLoad).toBe(true);
      expect(state2.shouldLoad).toBe(false);
    });

    it("advances load window sequentially without revealing early pages out-of-order", () => {
      const settled = new Set<number>();

      // Page 1 finishes before Page 0 (network race)
      settled.add(1);
      let revealed = advanceReaderReveal(settled, -1, 5);
      // Page 1 must NOT reveal yet because Page 0 has not settled
      expect(revealed).toBe(-1);

      // Now Page 0 finishes
      settled.add(0);
      revealed = advanceReaderReveal(settled, -1, 5);
      // Both Page 0 and Page 1 can now reveal in correct order
      expect(revealed).toBe(1);

      // Page 2 and 3 can now load
      expect(getReaderPageLoadState(2, 0, revealed, 2).shouldLoad).toBe(true);
      expect(getReaderPageLoadState(3, 0, revealed, 2).shouldLoad).toBe(true);
      expect(getReaderPageLoadState(4, 0, revealed, 2).shouldLoad).toBe(false);
    });

    it("recovers from permanent page failure and unblocks subsequent pages", () => {
      const settled = new Set<number>([0]);
      // Page 1 encounters fatal 404 / decode error and marks settled via onPermanentFailure
      settled.add(1);
      // Page 2 loads successfully
      settled.add(2);

      const revealed = advanceReaderReveal(settled, 0, 5);
      expect(revealed).toBe(2);

      // Downstream pages are not deadlocked
      expect(getReaderPageLoadState(3, 0, revealed, 2).shouldLoad).toBe(true);
      expect(getReaderPageLoadState(4, 0, revealed, 2).shouldLoad).toBe(true);
    });
  });
});
