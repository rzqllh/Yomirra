import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/sources/admin-source-service", () => ({
  getCoreSourceOverrides: vi.fn(),
}));

import { sourceManager } from "../source-manager";
import { getCoreSourceOverrides } from "../admin-source-service";

describe("SourceManager Kill-Switch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when source is disabled by admin override", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({
      shinigami: { id: "shinigami", isEnabled: false },
    });

    await expect(sourceManager.getSource("shinigami")).rejects.toThrow(
      "SOURCE_DISABLED: Source 'shinigami' is currently disabled by administrator."
    );
  });

  it("allows access to disabled source when allowDisabled option is true (for admin probe)", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({
      shinigami: { id: "shinigami", isEnabled: false },
    });

    const source = await sourceManager.getSource("shinigami", null, { allowDisabled: true });
    expect(source.id).toBe("shinigami");
  });

  it("returns active source normally when isEnabled is true or undefined", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({});

    const source = await sourceManager.getSource("shinigami");
    expect(source.id).toBe("shinigami");
  });
});
