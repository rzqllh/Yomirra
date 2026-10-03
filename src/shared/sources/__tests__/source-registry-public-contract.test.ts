import { describe, expect, it } from "vitest";
import { sourceRegistry } from "../source-registry";

describe("public source restriction classification", () => {
  it("does not classify a mixed general catalog as a restricted source", () => {
    const mixedCatalog = sourceRegistry.find((source) => source.id === "mangadex");
    expect(mixedCatalog?.isNsfw).toBe(false);
  });

  it("keeps source-level restricted counting driven by registry metadata", () => {
    const restricted = sourceRegistry.filter((source) => source.isNsfw);
    expect(restricted).toHaveLength(1);
  });
});
