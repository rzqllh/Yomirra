import { getFriendlyErrorMessage, type SourceErrorCode } from "../error";
import type { SourceHealthSnapshot } from "./types";

export interface PublicSourceHealth {
  id: string;
  status: "online" | "degraded" | "unavailable" | "unknown";
  latency: string;
  uptime: string;
  message: string;
  checkedAt: string;
  errorCode?: SourceErrorCode;
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

export function toPublicSourceHealth(snapshot: SourceHealthSnapshot): PublicSourceHealth {
  if (snapshot.status === "HEALTHY") {
    return {
      id: snapshot.sourceId,
      status: "online",
      latency: `${snapshot.latencyMs}ms`,
      uptime: "-",
      message: "Server merespons dengan baik.",
      checkedAt: snapshot.lastCheckedAt,
    };
  }

  if (snapshot.status === "DEGRADED" || snapshot.status === "RATE_LIMITED") {
    return {
      id: snapshot.sourceId,
      status: "degraded",
      latency: `${snapshot.latencyMs}ms`,
      uptime: "-",
      message: snapshot.lastFailureCode
        ? failureMessage(snapshot)
        : "Sumber merespons lebih lambat dari biasanya.",
      checkedAt: snapshot.lastCheckedAt,
      errorCode: snapshot.lastFailureCode,
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
    };
  }

  return {
    id: snapshot.sourceId,
    status: "unavailable",
    latency: snapshot.latencyMs > 0 ? `${snapshot.latencyMs}ms` : "-",
    uptime: "-",
    message: failureMessage(snapshot),
    checkedAt: snapshot.lastCheckedAt,
    errorCode: snapshot.lastFailureCode,
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
