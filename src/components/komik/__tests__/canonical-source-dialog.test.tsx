import { describe, expect, it } from "vitest";
import { isCanonicalBindingAvailable } from "../canonical-source-dialog";

describe("canonical source availability", () => {
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
