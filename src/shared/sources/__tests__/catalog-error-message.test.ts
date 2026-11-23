import { describe, expect, it } from "vitest";
import { getCatalogErrorMessage } from "../catalog-error-message";

describe("catalog error display", () => {
  it("explains access rejection without claiming maintenance", () => {
    expect(getCatalogErrorMessage({ code: "UPSTREAM_BLOCKED" })).toContain("menolak permintaan");
  });
  it("discourages rate-limit retry loops", () => {
    expect(getCatalogErrorMessage({ code: "RATE_LIMITED" })).toContain("Batas permintaan tercapai");
  });
  it("never displays upstream secrets", () => {
    expect(getCatalogErrorMessage({ code: "UNKNOWN", message: "secret-token-and-host" }))
      .not.toContain("secret-token");
  });
});
