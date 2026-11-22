import { describe, expect, it } from "vitest";
import {
  KEIYOUSHI_CANDIDATES, keiyoushiNeedsRestrictedOptIn,
} from "../keiyoushi-candidates";
import {
  getAllSourceMetadata, getPendingSourceMetadata, pendingSourceRegistry, sourceRegistry,
} from "../source-registry";
import { getStagedKeiyoushiSourceIds } from "@/server/lib/sources/adapters/keiyoushi";

describe("Keiyoushi owner ZIP integration safety", () => {
  it("has exactly 31 unique, normalized candidates outside the nine existing sources", () => {
    expect(KEIYOUSHI_CANDIDATES).toHaveLength(31);
    expect(new Set(KEIYOUSHI_CANDIDATES.map(s => s.id)).size).toBe(31);
    const builtins = new Set(sourceRegistry.map(s => s.id));
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      expect(candidate.id).toMatch(/^[a-z0-9-]+$/);
      expect(builtins.has(candidate.id)).toBe(false);
      expect(new URL(candidate.baseUrl).protocol).toBe("https:");
    }
  });

  it("preserves all restricted candidates behind opt-in and in-dev gates", () => {
    expect(KEIYOUSHI_CANDIDATES.filter(c => c.category === "SFW")).toHaveLength(7);
    expect(KEIYOUSHI_CANDIDATES.filter(c => c.category === "MIXED")).toHaveLength(6);
    expect(KEIYOUSHI_CANDIDATES.filter(c => c.category === "NSFW")).toHaveLength(18);
    expect(pendingSourceRegistry).toHaveLength(31);
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      const pending = getPendingSourceMetadata(candidate.id)!;
      expect(pending).toBeDefined();
      expect(pending.isEnabled).toBe(false);
      expect(pending.status).toBe("in-dev");
      expect(pending.isNsfw).toBe(keiyoushiNeedsRestrictedOptIn(candidate));
      expect(pending.capabilities.search).toBe(false);
      expect(getAllSourceMetadata().some(s => s.id === candidate.id)).toBe(false);
    }
  });

  it("stages the 28 HTML candidates and excludes three API engines", () => {
    const ids = getStagedKeiyoushiSourceIds();
    expect(ids).toHaveLength(28);
    expect(new Set(ids).size).toBe(28);
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      expect(ids.includes(candidate.id)).toBe(candidate.engine !== "api");
    }
  });
});
