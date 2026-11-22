import { describe, expect, it } from "vitest";
import type { SourceMetadata } from "@/shared/sources/source-types";
import type { SourceHealthSnapshot } from "../health/types";
import { applyDiscoveryMaintenance } from "../discovery-runtime-sources";

const source = {
  id: "shinigami",
  name: "Shinigami",
  isEnabled: true,
  isInstalled: true,
  isNsfw: false,
  isDynamic: false,
  status: "unknown",
  capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: true },
} satisfies SourceMetadata;
const probe = {
  sourceId: "shinigami",
  status: "BROKEN",
  consecutiveFailures: 5,
  resolvedHost: "https://api.shngm.io",
  latencyMs: 15000,
  lastCheckedAt: "2026-11-23T01:00:00.000Z",
  lastSuccessAt: null,
  lastFailureAt: "2026-11-23T01:00:00.000Z",
} satisfies SourceHealthSnapshot;

describe("maintenance is operator-controlled", () => {
  it("never disables a reader just because monitoring failed repeatedly", () => {
    expect(applyDiscoveryMaintenance(source, probe).maintenance).toBeUndefined();
  });
  it("does not silently cancel explicit operator maintenance", () => {
    const manual = { ...source, maintenance: { reason: "Operator maintenance", since: "2026-11-23T00:00:00Z" } };
    expect(applyDiscoveryMaintenance(manual, { ...probe, status: "HEALTHY", consecutiveFailures: 0 }).maintenance)
      .toEqual(manual.maintenance);
  });
});
