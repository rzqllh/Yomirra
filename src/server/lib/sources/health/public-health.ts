import { getFriendlyErrorMessage, type SourceErrorCode } from "../error";
import type { SourceHealthSnapshot, SourceRollingStats } from "./types";

export interface PublicSourceHealth {
  id: string;
  status: "online" | "degraded" | "unavailable" | "unknown";
  latency: string;
  uptime: string;
  message: string;
  checkedAt: string;
  errorCode?: SourceErrorCode;
  sampleCount?: number;
  p95Latency?: string;
  hasSufficientData?: boolean;
}

export interface LivenessSourceHealth {
  status: "ok" | "slow" | "down";
  latencyMs?: number;
  errorCode?: SourceErrorCode;
  error?: string;
}

function failureMessage(snapshot: SourceHealthSnapshot): string {
  return getFriendlyErrorMessage(snapshot.lastFailureCode ?? "UNKNOWN");
}

export function toPublicSourceHealth(
  snapshot: SourceHealthSnapshot,
  rollingStats?: SourceRollingStats | null
): PublicSourceHealth {
  if (snapshot.status === "HEALTHY") {
    return {
      id: snapshot.sourceId,
      status: "online",
      latency: rollingStats?.hasSufficientData
        ? rollingStats.p95Latency
        : snapshot.latencyMs > 0
        ? `${snapshot.latencyMs}ms`
        : "-",
      uptime: rollingStats?.hasSufficientData ? rollingStats.successRate : "-",
      message: "Server merespons dengan baik.",
      checkedAt: snapshot.lastCheckedAt,
      sampleCount: rollingStats?.totalSamples ?? 1,
      p95Latency: rollingStats?.hasSufficientData ? rollingStats.p95Latency : undefined,
      hasSufficientData: rollingStats?.hasSufficientData ?? false,
    };
  }

  if (snapshot.status === "DEGRADED" || snapshot.status === "RATE_LIMITED") {
    return {
      id: snapshot.sourceId,
      status: "degraded",
      latency: rollingStats?.hasSufficientData
        ? rollingStats.p95Latency
        : snapshot.latencyMs > 0
        ? `${snapshot.latencyMs}ms`
        : "-",
      uptime: rollingStats?.hasSufficientData ? rollingStats.successRate : "-",
      message: snapshot.lastFailureCode
        ? failureMessage(snapshot)
        : "Sumber merespons lebih lambat dari biasanya.",
      checkedAt: snapshot.lastCheckedAt,
      errorCode: snapshot.lastFailureCode,
      sampleCount: rollingStats?.totalSamples ?? 1,
      p95Latency: rollingStats?.hasSufficientData ? rollingStats.p95Latency : undefined,
      hasSufficientData: rollingStats?.hasSufficientData ?? false,
    };
  }

  if (snapshot.status === "UNKNOWN") {
    return {
      id: snapshot.sourceId,
      status: "unknown",
      latency: "-",
      uptime: "-",
      message: "Sumber belum diperiksa.",
      checkedAt: snapshot.lastCheckedAt,
      errorCode: snapshot.lastFailureCode,
      sampleCount: rollingStats?.totalSamples ?? 0,
      hasSufficientData: false,
    };
  }

  return {
    id: snapshot.sourceId,
    status: "unavailable",
    latency: "-",
    uptime: rollingStats?.hasSufficientData ? rollingStats.successRate : "-",
    message: failureMessage(snapshot),
    checkedAt: snapshot.lastCheckedAt,
    errorCode: snapshot.lastFailureCode,
    sampleCount: rollingStats?.totalSamples ?? 1,
    hasSufficientData: rollingStats?.hasSufficientData ?? false,
  };
}

export function createUnknownPublicSourceHealth(sourceId: string): PublicSourceHealth {
  return {
    id: sourceId,
    status: "unknown",
    latency: "-",
    uptime: "-",
    message: "Sumber belum diperiksa.",
    checkedAt: "",
    sampleCount: 0,
    hasSufficientData: false,
  };
}

export function toLivenessSourceHealth(snapshot: SourceHealthSnapshot): LivenessSourceHealth {
  if (snapshot.status === "HEALTHY") {
    return { status: "ok", latencyMs: snapshot.latencyMs };
  }

  if (snapshot.status === "DEGRADED" || snapshot.status === "RATE_LIMITED") {
    return {
      status: "slow",
      latencyMs: snapshot.latencyMs,
      errorCode: snapshot.lastFailureCode,
      ...(snapshot.lastFailureCode ? { error: failureMessage(snapshot) } : {}),
    };
  }

  return {
    status: "down",
    errorCode: snapshot.lastFailureCode ?? "UNKNOWN",
    error: failureMessage(snapshot),
  };
}
