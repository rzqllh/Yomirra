import { describe, expect, it } from "vitest";
import type { SourceMetadata } from "../source-types";
import { isSourceActiveForDisplay, sortSourcesForDisplay } from "../source-sort";

const source = (id: string, name: string, extra: Partial<SourceMetadata> = {}) => ({
  id, name, isEnabled: true, isInstalled: true, status: "unknown",
  isDynamic: false, isNsfw: false, ...extra,
}) as SourceMetadata;

describe("source page display ordering", () => {
  it("puts active sources first and sorts both groups alphabetically", () => {
    const items = [
      source("omega", "Omega", { status: "in-dev" }),
      source("zulu", "Zulu"),
      source("beta", "Beta"),
      source("alpha", "Alpha"),
      source("charlie", "Charlie"),
    ];
    const sorted = sortSourcesForDisplay(items, ["charlie", "beta"]);
    expect(sorted.map(({ id }) => id)).toEqual(["alpha", "zulu", "beta", "charlie", "omega"]);
    expect(items[0].id).toBe("omega");
  });

  it("does not equate monitoring failures with disabled sources", () => {
    const items = [
      source("a", "A", { maintenance: { reason: "Operator", since: "2026-11-23" } }),
      source("b", "B", { isEnabled: false }),
      source("c", "C", { status: "unavailable" }),
    ];
    expect(sortSourcesForDisplay(items, []).map(({ id }) => id)).toEqual(["c", "a", "b"]);
    expect(isSourceActiveForDisplay(items[2], new Set())).toBe(true);
  });
});
