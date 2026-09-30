import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/lib/sources/admin-source-service", () => ({
  getCoreSourceOverrides: vi.fn(),
}));

import { sourceManager } from "@/server/lib/sources/source-manager";
import { getCoreSourceOverrides } from "@/server/lib/sources/admin-source-service";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";

describe("Source Availability Contract", () => {
  it("strictly rejects admin-disabled sources regardless of consumer", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({
      komikindo: { id: "komikindo", isEnabled: false },
    });

    const runtimeSources = await getRuntimeSources();
    const komikindo = runtimeSources.find((s) => s.id === "komikindo");
    expect(komikindo?.isEnabled).toBe(false);

    // Reader & Search must fail to execute
    await expect(sourceManager.getSource("komikindo")).rejects.toThrow("SOURCE_DISABLED");

    // But admin probe succeeds with explicit bypass
    const probeInstance = await sourceManager.getSource("komikindo", null, { allowDisabled: true });
    expect(probeInstance.id).toBe("komikindo");
  });
});
