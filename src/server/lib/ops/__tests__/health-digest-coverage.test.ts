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
    expect(message).toContain("1 dari 2 source diperiksa");
    expect(message).not.toContain("Tidak ada tindakan.");
    expect(message).toContain("1 dari 2 source belum terukur");
    expect(message).not.toContain("3 source diperiksa");
  });

  it("rejects mismatched identity, old and future observations", () => {
    const message = formatHealthDigestWithCoverage(["shinigami","komikindo","mangadex"],{
      shinigami:{...healthySnapshot("other")},
      komikindo:{...healthySnapshot("komikindo"),lastCheckedAt:new Date(NOW.getTime()-10*60*1000).toISOString()},
      mangadex:{...healthySnapshot("mangadex"),lastCheckedAt:new Date(NOW.getTime()+60_000).toISOString()},
    },NOW);
    expect(message).toContain("0 dari 3 source berhasil diperiksa");
    expect(message).not.toContain("Tidak ada tindakan");
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

  it("distinguishes successful catalogue probes from verified page references", () => {
    const message = formatHealthDigestWithCoverage(["shinigami","komikindo","mangadex"], {
      shinigami: {...healthySnapshot("shinigami"),metadata:{probeType:"lightweight"}},
      komikindo: {...healthySnapshot("komikindo"),stage:"chapters",metadata:{probeType:"deep",pagesSkipped:"locked"}},
      mangadex: {...healthySnapshot("mangadex"),stage:"pages",metadata:{probeType:"deep",sampleChapterId:"fixture"}},
    },NOW);
    expect(message).toContain("Referensi halaman terverifikasi: 1/3 source");
    expect(message).toContain("Probe katalog bukan uji baca lengkap");
  });

  it("does not claim health when no active sources are registered", () => {
    const message = formatHealthDigestWithCoverage([], {}, NOW);
    expect(message).toContain("Belum ada source aktif");
    expect(message).not.toContain("normal");
  });
});
