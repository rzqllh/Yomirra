import { describe, expect, it } from "vitest";
import { sourceManager } from "../source-manager";

describe("dynamic source manifest loading", () => {
  it("rejects private-network URLs before fetching a manifest", async () => {
    await expect(
      sourceManager.getSource("custom", "http://127.0.0.1/manifest.json")
    ).rejects.toThrow("SECURITY_REJECTED: Unsafe IP address");
  });

  it("rejects non-HTTP protocols", async () => {
    await expect(
      sourceManager.getSource("custom", "file:///etc/passwd")
    ).rejects.toThrow("SECURITY_REJECTED: Unsupported protocol");
  });
});
