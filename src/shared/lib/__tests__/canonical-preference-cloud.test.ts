import { describe, expect, it } from "vitest";
import { canonicalPreferenceFieldKey, decodeCanonicalPreferenceMap, encodeCanonicalPreferenceMap } from "../canonical-preference-cloud";

describe("canonical preference cloud serialization", () => {
  it("round trips source IDs for arbitrary title identifiers", () => {
    const original = { "shinigami::title/id": "shinigami", "canonical:⚡": "asurascans" };
    expect({ ...decodeCanonicalPreferenceMap(encodeCanonicalPreferenceMap(original)) }).toEqual(original);
  });
  it("does not mistake prototype names or dotted keys for inherited objects", () => {
    const raw = JSON.parse('{"constructor":"komiku","toString":"shinigami","some%2Ekey":"asurascans"}');
    const data = decodeCanonicalPreferenceMap(raw);
    expect(Object.keys(data)).toHaveLength(3);
    expect(data.constructor).toBe("komiku");
    expect(canonicalPreferenceFieldKey("some.key")).toBe("some%2Ekey");
  });
  it("ignores malformed, empty, or unrelated values", () => {
    const result = decodeCanonicalPreferenceMap({ "%ZZ": "bad", "valid": "", "ok": "shinigami", "__proto__": 1 });
    expect(Object.keys(result)).toEqual(["ok"]);
  });
  it("refuses overly long and invalid IDs", () => {
    expect(() => canonicalPreferenceFieldKey("")).toThrow();
    expect(() => canonicalPreferenceFieldKey("a".repeat(701))).toThrow();
  });
});
