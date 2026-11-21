import { describe, expect, it } from "vitest";
import { formatDailyDigest } from "../daily-digest";
import type {
  SourceHealthSnapshot,
  SourceHealthStatus,
} from "@/server/lib/sources/health/types";

const NOW = new Date("2026-11-22T03:00:00.000Z");
const FRESH = "2026-11-22T02:00:00.000Z";

function snapshot(
  sourceId: string,
  status: SourceHealthStatus = "HEALTHY",
  lastCheckedAt = FRESH,
  latencyMs = 200
): SourceHealthSnapshot {
  return {
    sourceId,
    status,
    stage: "search",
    lastCheckedAt,
    latencyMs,
    resolvedHost: "example.test",
    lastSuccessAt: status === "HEALTHY" ? lastCheckedAt : null,
    lastFailureAt: status === "HEALTHY" ? null : lastCheckedAt,
    consecutiveFailures: status === "HEALTHY" ? 0 : 1,
  };
}

describe("formatDailyDigest source accuracy", () => {
  it("does not claim no active incidents when all observations are missing", () => {
    const message = formatDailyDigest(["shinigami", "komikindo"], {}, NOW);
    expect(message).toContain("0 dari 2 source normal");
    expect(message).toContain("2 belum terukur atau belum diperbarui");
    expect(message).toContain("Status keseluruhan belum dapat dipastikan");
    expect(message).toContain("Belum ada latency terbaru yang terukur");
    expect(message).not.toContain("Tidak ada gangguan aktif");
  });

  it("counts only active source IDs, regardless of stale or unrelated snapshots", () => {
    const message = formatDailyDigest(
      ["shinigami", "komikindo", "westmanga", "SHINIGAMI"],
      {
        shinigami: snapshot("shinigami"),
        komikindo: snapshot("komikindo", "BROKEN", FRESH, 850),
        westmanga: snapshot("westmanga", "HEALTHY", "2026-11-20T02:00:00.000Z"),
        disabled: snapshot("disabled"),
      },
      NOW
    );
    expect(message).toContain("1 dari 3 source normal");
    expect(message).toContain("1 perlu perhatian");
    expect(message).toContain("1 belum terukur atau belum diperbarui");
    expect(message).toContain("1 snapshot kedaluwarsa (>12 jam)");
    expect(message).not.toContain("4 source normal");
  });

  it("treats UNKNOWN and future-dated samples as unmeasured", () => {
    const message = formatDailyDigest(
      ["shinigami", "komikindo"],
      {
        shinigami: snapshot("shinigami", "UNKNOWN"),
        komikindo: snapshot("komikindo", "HEALTHY", "2026-11-23T00:00:00.000Z"),
      },
      NOW
    );
    expect(message).toContain("0 dari 2 source normal");
    expect(message).toContain("2 belum terukur atau belum diperbarui");
    expect(message).not.toContain("Tidak ada gangguan aktif");
  });

  it("reports no active incidents only when every source has fresh healthy data", () => {
    const message = formatDailyDigest(
      ["shinigami", "komikindo"],
      {
        shinigami: snapshot("shinigami"),
        komikindo: snapshot("komikindo", "HEALTHY", FRESH, 400),
      },
      NOW
    );
    expect(message).toContain("2 dari 2 source normal");
    expect(message).toContain("Tidak ada gangguan aktif pada pemeriksaan terbaru");
    expect(message).not.toContain("belum terukur");
  });

  it("handles an empty active source registry without claiming full health", () => {
    const message = formatDailyDigest([], { shinigami: snapshot("shinigami") }, NOW);
    expect(message).toContain("0 dari 0 source normal");
    expect(message).toContain("Belum ada source aktif yang terdaftar");
    expect(message).not.toContain("Tidak ada gangguan aktif");
  });
});
