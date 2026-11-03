import type { SourceErrorCode, SourceHealthStage } from "../error";
import type { SourceHealthStatus } from "@/shared/sources/source-types";

export type { SourceHealthStatus };

export interface SourceHealthSnapshot {
  sourceId: string;
  status: SourceHealthStatus;
  stage?: SourceHealthStage;
  latencyMs: number;
  resolvedHost: string;
  lastCheckedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
  lastFailureCode?: SourceErrorCode;
  errorMessage?: string;
  metadata?: {
    totalParsed?: number;
    sampleMangaId?: string;
    sampleChapterId?: string;
    probeType?: "lightweight" | "deep";
  };
}

export type HealthTransitionEvent =
  | "SOURCE_RECOVERED"
  | "SOURCE_BROKEN"
  | "SOURCE_DEGRADED"
  | "STATUS_CHANGED";

export interface SourceHealthTransition {
  sourceId: string;
  previousStatus: SourceHealthStatus;
  currentStatus: SourceHealthStatus;
  event: HealthTransitionEvent;
  snapshot: SourceHealthSnapshot;
  timestamp: string;
}

export interface HealthProbeOptions {
  deep?: boolean;
  timeoutMs?: number;
}

export interface SourceProbeSample {
  sourceId: string;
  timestamp: number;
  latencyMs: number;
  status: SourceHealthStatus;
  stage?: SourceHealthStage;
  probeType?: "lightweight" | "deep";
  errorCode?: SourceErrorCode;
}

export interface SourceRollingStats {
  sourceId: string;
  totalSamples: number;
  successfulSamples: number;
  successRate: string;
  p95LatencyMs: number | null;
  p95Latency: string;
  lastCheckedAt: string | null;
  hasSufficientData: boolean;
}

