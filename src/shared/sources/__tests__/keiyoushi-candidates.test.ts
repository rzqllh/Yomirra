import { describe, expect, it } from "vitest";
import {
  KEIYOUSHI_CANDIDATES,
} from "../keiyoushi-candidates";
import {
  getAllSourceMetadata, getPendingSourceMetadata, pendingSourceRegistry, sourceRegistry,
} from "../source-registry";
import { getStagedKeiyoushiSourceIds } from "@/server/lib/sources/adapters/keiyoushi";

describe("Keiyoushi owner ZIP integration safety", () => {
  it("has exactly 31 unique, normalized candidates outside the nine baseline sources", () => {
    expect(KEIYOUSHI_CANDIDATES).toHaveLength(31);
    expect(new Set(KEIYOUSHI_CANDIDATES.map(s => s.id)).size).toBe(31);
    const baseline = new Set(sourceRegistry.filter(s => s.id !== "manhwa-list").map(s => s.id));
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      expect(candidate.id).toMatch(/^[a-z0-9-]+$/);
      expect(baseline.has(candidate.id)).toBe(false);
      expect(new URL(candidate.baseUrl).protocol).toBe("https:");
    }
  });

  it("preserves unverified candidates behind opt-in and in-dev gates while verified manhwa-list is promoted", () => {
    expect(KEIYOUSHI_CANDIDATES.filter(c => c.category === "SFW")).toHaveLength(7);
    expect(KEIYOUSHI_CANDIDATES.filter(c => c.category === "MIXED")).toHaveLength(6);
    expect(KEIYOUSHI_CANDIDATES.filter(c => c.category === "NSFW")).toHaveLength(18);

    // 30 unverified candidates remain in pendingSourceRegistry; manhwa-list is promoted to active registry
    expect(pendingSourceRegistry).toHaveLength(30);
    expect(getPendingSourceMetadata("manhwa-list")).toBeUndefined();
    expect(sourceRegistry.some(s => s.id === "manhwa-list" && s.isEnabled)).toBe(true);
    expect(getAllSourceMetadata().some(s => s.id === "manhwa-list")).toBe(true);

    for (const pending of pendingSourceRegistry) {
      expect(pending).toBeDefined();
      expect(pending.isEnabled).toBe(false);
      expect(pending.status).toBe("in-dev");
      expect(pending.capabilities.search).toBe(false);
      expect(getAllSourceMetadata().some(s => s.id === pending.id)).toBe(false);
    }
  });

  it("stages all 31 candidates, including three dedicated API prototypes", () => {
    const ids = getStagedKeiyoushiSourceIds();
    expect(ids).toHaveLength(31);
    expect(new Set(ids).size).toBe(31);
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      expect(ids.includes(candidate.id)).toBe(true);
    }
  });
});
