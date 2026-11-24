import { describe, expect, it } from "vitest";
import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import { getStagedKeiyoushiSource } from "../index";

const requestedId = process.env.KEIYOUSHI_PROBE_SOURCE;
const allowed = KEIYOUSHI_CANDIDATES.find(candidate => candidate.id === requestedId && candidate.category === "SFW");
const supportedIds = new Set(["manhwa-list", "izanamiscans", "ainzscansid", "soul-scans"]);
const describeLive = process.env.KEIYOUSHI_LIVE_PROBE === "1" ? describe : describe.skip;

describeLive("Manual authorized upstream metadata verification", () => {
  it("requires an explicitly permitted SFW source and a nonempty public listing", async () => {
    // This opt-in test must only be run where upstream permission is established.
    // Never bulk probe, fetch locked chapters, or treat a failed request as PASS.
    expect(process.env.KEIYOUSHI_PROBE_PERMISSION).toBe("confirmed");
    expect(allowed && supportedIds.has(allowed.id)).toBeTruthy();
    const adapter = getStagedKeiyoushiSource(allowed!.id)!;
    expect(adapter.isEnabled).toBe(false);
    const results = await adapter.getPopular(1, { hideNsfw: true });
    expect(results.mangas.length).toBeGreaterThan(0);
    const sample = results.mangas.find(row => row.id && row.title && row.isNsfw !== true && row.contentRating === "safe");
    expect(sample).toBeDefined();
    const detail = await adapter.getDetail(sample!.id, { hideNsfw: true });
    expect(detail.id).toBe(sample!.id);
    expect(detail.title.trim()).not.toBe("");
    expect(detail.isNsfw).not.toBe(true);
  }, 30000);
});
