import { describe, expect, it } from "vitest";
import { planPreferredSourceMerge } from "../canonical-preference-merge";

describe("canonical guest/cloud preference conflict contract", () => {
  it("keeps cloud when guest is empty, guest when cloud is empty, and shared choices without prompting", () => {
    const p = planPreferredSourceMerge({ c1: "guest", c3: "same" }, { c2: "cloud", c3: "same" });
    expect(p.canCommit).toBe(true);
    expect(p.conflicts).toHaveLength(0);
    expect({ ...p.resolved }).toEqual({ c1: "guest", c2: "cloud", c3: "same" });
  });
  it("requires one explicit decision per conflicting canonical, never latest timestamp", () => {
    const p = planPreferredSourceMerge({ c1: "shinigami", c2: "komiku" }, { c1: "asurascans", c2: "mangadex" });
    expect(p.canCommit).toBe(false);
    expect(p.conflicts).toHaveLength(2);
    expect(p.resolved.c1).toBeUndefined();
  });
  it("keeps unresolved entries pending, and accepts only a choice from either original source", () => {
    const guest = { c1: "shinigami", c2: "komiku" };
    const cloud = { c1: "asurascans", c2: "mangadex" };
    const partial = planPreferredSourceMerge(guest, cloud, { c1: "asurascans", c2: "unknown-source" });
    expect(partial.canCommit).toBe(false);
    expect(partial.conflicts).toHaveLength(1);
    expect(partial.resolved.c1).toBe("asurascans");
    const done = planPreferredSourceMerge(guest, cloud, { c1: "asurascans", c2: "komiku" });
    expect(done.canCommit).toBe(true);
    expect({ ...done.resolved }).toEqual({ c1: "asurascans", c2: "komiku" });
  });
  it("replayed decisions are deterministic and do not mutate either source", () => {
    const guest = Object.freeze({ work: "shinigami" });
    const cloud = Object.freeze({ work: "asurascans" });
    const decisions = Object.freeze({ work: "shinigami" });
    expect(planPreferredSourceMerge(guest, cloud, decisions)).toEqual(planPreferredSourceMerge(guest, cloud, decisions));
    expect(cloud.work).toBe("asurascans");
  });
  it("treats prototype-like keys as data rather than inherited properties", () => {
    const guest = JSON.parse('{"constructor":"a"}') as Record<string, string>;
    const cloud = JSON.parse('{"constructor":"b"}') as Record<string, string>;
    const p = planPreferredSourceMerge(guest, cloud);
    expect(p.conflicts).toHaveLength(1);
    expect(p.conflicts[0].canonicalId).toBe("constructor");
  });
});
