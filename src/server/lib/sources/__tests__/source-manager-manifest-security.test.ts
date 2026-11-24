import { describe, expect, it } from "vitest";
import { sourceManager } from "../source-manager";

describe("dynamic source manifest loading", () => {
  it("cannot publish staged sources through a custom manifest or ordinary lookup", async () => {
    await expect(sourceManager.getSource("manhwa-list")).rejects.toThrow("SOURCE_DISABLED");
    await expect(sourceManager.getSource("ainz-scans-id", "https://example.com/manifest.json")).rejects.toThrow("SOURCE_DISABLED");
    const staged = await sourceManager.getSource("manhwa-list", null, { allowDisabled: true });
    expect(staged.id).toBe("manhwa-list");
    expect(staged.isEnabled).toBe(false);
    expect(staged.status).toBe("in-dev");
  });
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
