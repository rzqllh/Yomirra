import { describe, expect, it } from "vitest";
import { sourceRegistry } from "../source-registry";

describe("source filter capability contract", () => {
  it("matches filter capability to verified provider behavior", () => {
    const capabilities = Object.fromEntries(
      sourceRegistry.map((source) => [source.id, source.capabilities.filters === true])
    );

    expect(capabilities).toMatchObject({
      shinigami: true,
      komikindo: true,
      mangadex: true,
      komiku: false,
      "komiku-ii": true,
      asurascans: true,
      komiknesia: false,
      doujindesu: true,
      westmanga: false,
    });
  });

  it("does not leave built-in filter capability undefined", () => {
    for (const source of sourceRegistry) {
      expect(typeof source.capabilities.filters).toBe("boolean");
    }
  });
});
