import { describe, expect, it, vi } from "vitest";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { selectDiscoverySources } from "@/shared/sources/discovery-source-policy";
import type { SourceHealthSnapshot } from "../health/types";
import { applyDiscoveryMaintenance } from "../discovery-runtime-sources";

vi.mock("../runtime-sources", () => ({ getRuntimeSources: vi.fn() }));
vi.mock("../health/health-store", () => ({ sourceHealthStore: {} }));

const sources = getAllSourceMetadata();
const westmanga = sources.find(({ id }) => id === "westmanga")!;
const shinigami = sources.find(({ id }) => id === "shinigami")!;

function snapshot(status: SourceHealthSnapshot["status"], consecutiveFailures: number): SourceHealthSnapshot {
  return {
    sourceId: "westmanga",
    status,
    consecutiveFailures,
    resolvedHost: "",
    latencyMs: 30,
    lastCheckedAt: "2026-11-06T00:00:00.000Z",
    lastSuccessAt: null,
    lastFailureAt: null,
  };
}

describe("discovery maintenance", () => {
  it("excludes verified incidents by default and restores sources after a successful probe", () => {
    expect(selectDiscoverySources([westmanga], [])).toEqual([]);
    expect(applyDiscoveryMaintenance(westmanga, {
      ...snapshot("HEALTHY", 0),
      lastCheckedAt: "2026-11-04T00:00:00.000Z",
    }).maintenance).toBeDefined();

    const recovered = applyDiscoveryMaintenance(westmanga, snapshot("HEALTHY", 0));
    expect(selectDiscoverySources([recovered], [])).toEqual([recovered]);
    expect(selectDiscoverySources([recovered], ["westmanga"])).toEqual([]);
  });

  it("requires repeated functional failures for other sources", () => {
    expect(applyDiscoveryMaintenance(shinigami, snapshot("BROKEN", 1)).maintenance).toBeUndefined();
    expect(applyDiscoveryMaintenance(shinigami, snapshot("BROKEN", 2)).maintenance).toBeDefined();
  });
});
