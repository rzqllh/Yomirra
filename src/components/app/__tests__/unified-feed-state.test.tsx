import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedFeed } from "@/components/home/unified-feed";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { loadSourceCatalog } from "@/server/lib/sources/content-access";
import type { SourceMetadata } from "@/shared/sources/source-types";

vi.mock("@/server/lib/sources/source-manager", () => ({ sourceManager: { getSource: vi.fn() } }));
vi.mock("@/server/lib/sources/content-access", () => ({ loadSourceCatalog: vi.fn() }));
vi.mock("@/server/lib/sources/server-manifest", () => ({ getManifestUrlFromCookie: vi.fn().mockResolvedValue(undefined) }));

const sources = ["a", "b"].map(id => ({ id, name: `Source ${id}`, isEnabled: true, isInstalled: true, isNsfw: false, capabilities: { popular: true, latest: true } })) as SourceMetadata[];
beforeEach(() => {
  vi.mocked(sourceManager.getSource).mockReset().mockImplementation(async id => ({ id }) as never);
  vi.mocked(loadSourceCatalog).mockReset().mockResolvedValue({ mangas: [], hasNextPage: false });
});

describe("Beranda source outcomes", () => {
  it("retains the home/search surface when every source fails", async () => {
    vi.mocked(loadSourceCatalog).mockRejectedValue(new Error("Provider unreachable"));
    const surface = await UnifiedFeed({ activeSources: sources });
    expect(surface).not.toBeNull();
    expect(surface.props.catalogState).toBe("unavailable");
    expect(surface.props.unifiedLatest).toEqual([]);
  });
  it("distinguishes a healthy empty catalog from provider failure", async () => {
    const surface = await UnifiedFeed({ activeSources: sources });
    expect(surface.props.catalogState).toBe("empty");
  });
  it("keeps successful source content while exposing partial failure", async () => {
    vi.mocked(loadSourceCatalog).mockImplementation(async source => {
      if (source.id === "b") throw new Error("Rate limited");
      return { mangas: [{ id: "work-a", title: "Work A", coverUrl: "", isNsfw: false }], hasNextPage: false };
    });
    const surface = await UnifiedFeed({ activeSources: sources });
    expect(surface.props.catalogState).toBe("partial");
    expect(surface.props.unifiedLatest).toEqual([expect.objectContaining({ id: "work-a", sourceId: "a" })]);
  });
  it("retains search with disabled sources without reporting a provider outage", async () => {
    const surface = await UnifiedFeed({ activeSources: [] });
    expect(surface.props.catalogState).toBeUndefined();
    expect(sourceManager.getSource).not.toHaveBeenCalled();
  });
});
