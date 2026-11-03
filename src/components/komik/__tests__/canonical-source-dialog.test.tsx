import { describe, expect, it } from "vitest";
import { isCanonicalBindingAvailable, prioritizeCanonicalBindings } from "../canonical-source-dialog";

describe("canonical source availability", () => {
  it("pins a recently healthy last-read source first without selecting it", () => {
    const now = 1000000;
    const bindings = [
      { sourceId: "komiku", mangaId: "a", title: "A" },
      { sourceId: "mangadex", mangaId: "b", title: "A" },
      { sourceId: "shinigami", mangaId: "c", title: "A" },
    ];
    const health = {
      komiku: { status: "online" as const, lastSuccessAt: now - 1000 },
      mangadex: { status: "online" as const, lastSuccessAt: now - 2000 },
      shinigami: { status: "degraded" as const, lastSuccessAt: 0, lastErrorAt: now - 3000 },
    };
    const result = prioritizeCanonicalBindings(bindings, "mangadex", health, now);
    expect(result.map((binding) => binding.sourceId)).toEqual(["mangadex", "komiku", "shinigami"]);
    expect(bindings[0].sourceId).toBe("komiku");
  });

  it("does not pin stale last-read health above a recently healthy alternative", () => {
    const now = 2000000;
    const bindings = [
      { sourceId: "mangadex", mangaId: "b", title: "A" },
      { sourceId: "komiku", mangaId: "a", title: "A" },
    ];
    const result = prioritizeCanonicalBindings(bindings, "mangadex", {
      mangadex: { status: "online", lastSuccessAt: now - 6 * 60 * 1000 },
      komiku: { status: "online", lastSuccessAt: now - 1000 },
    }, now);
    expect(result.map((binding) => binding.sourceId)).toEqual(["komiku", "mangadex"]);
  });

  it("does not mistake an unavailable observed source for a healthy last-read source", () => {
    const now = 3000000;
    const bindings = [
      { sourceId: "shinigami", mangaId: "c", title: "A" },
      { sourceId: "komiku", mangaId: "a", title: "A" },
    ];
    const result = prioritizeCanonicalBindings(bindings, "shinigami", {
      shinigami: { status: "offline", lastSuccessAt: now - 1000, lastErrorAt: now - 500 },
      komiku: { status: "online", lastSuccessAt: now - 1000 },
    }, now);
    expect(result.map((binding) => binding.sourceId)).toEqual(["komiku", "shinigami"]);
  });

  const binding = {
    sourceId: "komiku",
    mangaId: "test-title",
    title: "Test Title",
  };

  it("keeps an active source selectable", () => {
    expect(isCanonicalBindingAvailable(binding, [])).toBe(true);
  });

  it("hides a source disabled by the user", () => {
    expect(isCanonicalBindingAvailable(binding, ["komiku"])).toBe(false);
  });
});
