import { describe, expect, it } from "vitest";
import { formatHealthDigestWithCoverage } from "../health-digest";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";

const NOW = new Date("2026-11-22T03:00:00.000Z");

function healthySnapshot(sourceId: string): SourceHealthSnapshot {
  return {
    sourceId,
    status: "HEALTHY",
    stage: "search",
    latencyMs: 150,
    resolvedHost: "example.test",
    lastCheckedAt: NOW.toISOString(),
    lastSuccessAt: NOW.toISOString(),
    lastFailureAt: null,
    consecutiveFailures: 0,
  };
}

describe("formatHealthDigestWithCoverage", () => {
  it("does not use stale snapshots to claim all sources are healthy", () => {
    const message = formatHealthDigestWithCoverage(
      ["shinigami", "komikindo"],
      {},
      NOW
    );
    expect(message).toContain("0 dari 2 source berhasil diperiksa");
    expect(message).toContain("2 belum terukur");
    expect(message).toContain("Status belum dapat dipastikan");
    expect(message).not.toContain("Tidak ada tindakan");
  });

  it("shows partial probe coverage and excludes unknown source results", () => {
    const message = formatHealthDigestWithCoverage(
      ["shinigami", "komikindo", "SHINIGAMI"],
      {
        shinigami: healthySnapshot("shinigami"),
        other: healthySnapshot("other"),
      },
      NOW
    );
    expect(message).toContain("1 source diperiksa");
    expect(message).toContain("1 dari 2 source belum terukur");
    expect(message).not.toContain("3 source diperiksa");
  });

  it("preserves full-coverage reporting when all probes complete", () => {
    const message = formatHealthDigestWithCoverage(
      ["shinigami", "komikindo"],
      {
        shinigami: healthySnapshot("shinigami"),
        komikindo: healthySnapshot("komikindo"),
      },
      NOW
    );
    expect(message).toContain("2 source diperiksa");
    expect(message).toContain("2/2 source normal");
    expect(message).not.toContain("belum terukur");
  });

  it("does not claim health when no active sources are registered", () => {
    const message = formatHealthDigestWithCoverage([], {}, NOW);
    expect(message).toContain("Belum ada source aktif");
    expect(message).not.toContain("normal");
  });
});
