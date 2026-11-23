import { describe, expect, it } from "vitest";
import { planVerifiedAliasPreferenceMerge } from "../canonical-preference-alias";

const item = (id: string, sourceId: string, mangaId: string, linkedSources: Array<{
  sourceId: string; mangaId: string; matchConfidence: "CONFIRMED" | "HIGH_CONFIDENCE";
}> = []) => ({ id, sourceId, mangaId, linkedSources });

describe("guest/cloud canonical alias preference reconciliation", () => {
  it("detects conflict for different SavedTitleIds pointing to the same provider identity", () => {
    const guest = [item("guest-id", "mangadex", "work")];
    const cloud = [item("cloud-id", "mangadex", "work")];
    const plan = planVerifiedAliasPreferenceMerge(
      { "guest-id": "shinigami" }, { "cloud-id": "komiku" }, guest, cloud,
    );
    expect(plan.canCommit).toBe(false);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].choices).toEqual(["shinigami", "komiku"]);
    expect(plan.conflicts[0].canonicalId).toBe("cloud-id");
  });

  it("works with confirmed cross-provider link but never with high-confidence title match", () => {
    const cloud = [item("cloud", "komiku", "work-b")];
    const verified = [item("guest", "mangadex", "work-a", [
      { sourceId: "komiku", mangaId: "work-b", matchConfidence: "CONFIRMED" },
    ])];
    const unverified = [item("guest", "mangadex", "work-a", [
      { sourceId: "komiku", mangaId: "work-b", matchConfidence: "HIGH_CONFIDENCE" },
    ])];
    expect(planVerifiedAliasPreferenceMerge(
      { guest: "mangadex" }, { cloud: "komiku" }, verified, cloud,
    ).conflicts).toHaveLength(1);
    expect(planVerifiedAliasPreferenceMerge(
      { guest: "mangadex" }, { cloud: "komiku" }, unverified, cloud,
    ).conflicts).toHaveLength(0);
  });

  it("never silently picks one of two guest aliases with opposing preferences", () => {
    const library = [
      item("a", "mangadex", "a", [{ sourceId: "komiku", mangaId: "b", matchConfidence: "CONFIRMED" }]),
      item("b", "komiku", "b"),
    ];
    const pending = planVerifiedAliasPreferenceMerge({ a: "mangadex", b: "komiku" }, {}, library, []);
    expect(pending.canCommit).toBe(false);
    expect(pending.conflicts).toHaveLength(1);
    const done = planVerifiedAliasPreferenceMerge(
      { a: "mangadex", b: "komiku" }, {}, library, [],
      { a: "mangadex" },
    );
    expect(done.canCommit).toBe(true);
    expect({ ...done.resolved }).toEqual({ a: "mangadex" });
  });

  it("accepts one explicit choice and is replay-safe without mutating originals", () => {
    const guestPrefs = Object.freeze({ local: "mangadex" });
    const cloudPrefs = Object.freeze({ remote: "komiku" });
    const guest = Object.freeze([Object.freeze(item("local", "mangadex", "a", [
      { sourceId: "komiku", mangaId: "b", matchConfidence: "CONFIRMED" },
    ]))]);
    const cloud = Object.freeze([Object.freeze(item("remote", "komiku", "b"))]);
    const decisions = { local: "komiku" };
    const plan = planVerifiedAliasPreferenceMerge(guestPrefs, cloudPrefs, guest, cloud, decisions);
    expect(plan.canCommit).toBe(true);
    expect(plan.resolved.local).toBe("komiku");
    expect(planVerifiedAliasPreferenceMerge(guestPrefs, cloudPrefs, guest, cloud, decisions)).toEqual(plan);
  });

  it("does not merge unrelated same-title aliases and supports special object keys", () => {
    const guest = JSON.parse('{"constructor":"mangadex"}') as Record<string, string>;
    const cloud = JSON.parse('{"constructor":"komiku"}') as Record<string, string>;
    const plan = planVerifiedAliasPreferenceMerge(guest, cloud, [], []);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].canonicalId).toBe("constructor");
  });
});
