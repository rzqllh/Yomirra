import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/sources/admin-source-service", () => ({
  getCoreSourceOverrides: vi.fn(),
}));

vi.mock("@/server/lib/sources/custom-source-service", () => ({
  getCustomSources: vi.fn(),
}));

import { getRuntimeSources, isSourceEnabledServer } from "../runtime-sources";
import { getCoreSourceOverrides } from "../admin-source-service";
import { getCustomSources } from "../custom-source-service";
import { sourceRegistry } from "@/shared/sources/source-registry";

describe("runtime-sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns baseline sourceRegistry when no overrides or custom sources exist", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({});
    vi.mocked(getCustomSources).mockResolvedValue([]);

    const sources = await getRuntimeSources();
    expect(sources.length).toBeGreaterThanOrEqual(sourceRegistry.length);
    const shinigami = sources.find((s) => s.id === "shinigami");
    expect(shinigami?.isEnabled).toBe(true);
  });

  it("applies isEnabled override from Redis correctly", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({
      shinigami: { id: "shinigami", isEnabled: false },
    });
    vi.mocked(getCustomSources).mockResolvedValue([]);

    const sources = await getRuntimeSources();
    const shinigami = sources.find((s) => s.id === "shinigami");
    expect(shinigami?.isEnabled).toBe(false);

    const isEnabled = await isSourceEnabledServer("shinigami");
    expect(isEnabled).toBe(false);
  });

  it("applies activeDomain override from Redis correctly", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({
      shinigami: { id: "shinigami", activeDomain: "https://mirror.shinigami.example" },
    });
    vi.mocked(getCustomSources).mockResolvedValue([]);

    const sources = await getRuntimeSources();
    const shinigami = sources.find((s) => s.id === "shinigami");
    expect(shinigami?.baseUrl).toBe("https://mirror.shinigami.example");
  });

  it("merges custom sources from Redis", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({});
    vi.mocked(getCustomSources).mockResolvedValue([
      {
        id: "custom-test",
        name: "Custom Test Source",
        baseUrl: "https://custom.test",
        type: "html",
        isNsfw: false,
        lang: "id",
        version: "1.0.0",
        selectors: {
          popularList: ".item",
          popularTitle: ".title",
          popularLink: "a",
          popularCover: "img",
        },
      } as any,
    ]);

    const sources = await getRuntimeSources();
    const custom = sources.find((s) => s.id === "custom-test");
    expect(custom).toBeDefined();
    expect(custom?.name).toBe("Custom Test Source");
    expect(custom?.isDynamic).toBe(true);
    expect(custom?.capabilities.filters).toBe(false);
  });

  it("falls back to baseline sourceRegistry if Redis calls throw error", async () => {
    vi.mocked(getCoreSourceOverrides).mockRejectedValue(new Error("Redis connection timeout"));
    vi.mocked(getCustomSources).mockRejectedValue(new Error("Redis offline"));

    const sources = await getRuntimeSources();
    expect(sources.length).toBe(sourceRegistry.length);
    const shinigami = sources.find((s) => s.id === "shinigami");
    expect(shinigami?.isEnabled).toBe(true);
  });

  it("prevents custom sources from shadowing built-in source IDs", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({});
    vi.mocked(getCustomSources).mockResolvedValue([
      {
        id: "komiku",
        name: "Fake Malicious Komiku",
        baseUrl: "https://evil-komiku.example",
      } as any,
    ]);

    const sources = await getRuntimeSources();
    const komikuInstances = sources.filter((s) => s.id === "komiku");
    expect(komikuInstances.length).toBe(1);
    expect(komikuInstances[0].name).not.toBe("Fake Malicious Komiku");
  });

  it("skips malformed custom source records gracefully", async () => {
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({});
    vi.mocked(getCustomSources).mockResolvedValue([
      null as any,
      {} as any,
      { id: "", name: "No ID", baseUrl: "https://example.com" } as any,
      { id: "valid-custom", name: "Valid Custom", baseUrl: "https://valid.example" } as any,
    ]);

    const sources = await getRuntimeSources();
    const validCustom = sources.find((s) => s.id === "valid-custom");
    expect(validCustom).toBeDefined();
    expect(validCustom?.name).toBe("Valid Custom");
  });

  it("returns null for unknown or invalid source lookups", async () => {
    const { getRuntimeSource } = await import("../runtime-sources");
    vi.mocked(getCoreSourceOverrides).mockResolvedValue({});
    vi.mocked(getCustomSources).mockResolvedValue([]);

    expect(await getRuntimeSource("non-existent-source")).toBeNull();
    expect(await getRuntimeSource("")).toBeNull();
    expect(await isSourceEnabledServer("non-existent-source")).toBe(false);
  });
});
