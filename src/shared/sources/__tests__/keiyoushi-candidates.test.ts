import { describe, expect, it } from "vitest";
import { KEIYOUSHI_CANDIDATES } from "../keiyoushi-candidates";
import {
  getAllSourceMetadata, getPendingSourceMetadata, pendingSourceRegistry, sourceRegistry,
} from "../source-registry";
import { getStagedKeiyoushiSourceIds } from "@/server/lib/sources/adapters/keiyoushi";

describe("Keiyoushi porting staging and source-safety contract", () => {
  it("preserves exactly 31 unique candidates without replacing existing built-ins", () => {
    expect(sourceRegistry).toHaveLength(9);
    expect(KEIYOUSHI_CANDIDATES).toHaveLength(31);
    expect(new Set(KEIYOUSHI_CANDIDATES.map(item => item.id)).size).toBe(31);
    const builtIns = new Set(sourceRegistry.map(item => item.id));
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      expect(builtIns.has(candidate.id)).toBe(false);
      expect(candidate.id).toMatch(/^[a-z0-9-]+$/);
      expect(new URL(candidate.baseUrl).protocol).toBe("https:");
    }
  });

  it("keeps all candidates disabled, including the four previously probed sources", () => {
    expect(KEIYOUSHI_CANDIDATES.filter(item => item.category === "SFW")).toHaveLength(7);
    expect(KEIYOUSHI_CANDIDATES.filter(item => item.category === "MIXED")).toHaveLength(6);
    expect(KEIYOUSHI_CANDIDATES.filter(item => item.category === "NSFW")).toHaveLength(18);
    expect(pendingSourceRegistry).toHaveLength(31);
    const visible = new Set(getAllSourceMetadata().map(item => item.id));
    for (const candidate of KEIYOUSHI_CANDIDATES) {
      const pending = getPendingSourceMetadata(candidate.id);
      expect(pending).toBeDefined();
      expect(pending?.isEnabled).toBe(false);
      expect(pending?.status).toBe("in-dev");
      expect(pending?.capabilities.search).toBe(false);
      expect(pending?.capabilities.download).toBe(false);
      expect(visible.has(candidate.id)).toBe(false);
      expect(pending?.isNsfw).toBe(candidate.category !== "SFW");
    }
  });

  it("retains all 31 isolated diagnostic adapters", () => {
    const ids = getStagedKeiyoushiSourceIds();
    expect(ids).toHaveLength(31);
    expect(new Set(ids).size).toBe(31);
    for (const candidate of KEIYOUSHI_CANDIDATES) expect(ids).toContain(candidate.id);
  });
});
