import type { SourceHealthStatus } from "@/shared/sources/source-types";

export interface SourceHealthMatrixItem {
  id: string;
  name: string;
  isEnabled: boolean;
  isInstalled: boolean;
  status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNMEASURED";
  healthStatus: SourceHealthStatus;
  consecutiveFailures: number;
  latencyMs: number;
  lastCheckedAt?: string;
  mirrors: string[];
  activeDomain: string;
  upstreamDomain: string;
}

export interface ParserTestResult {
  success: boolean;
  latencyMs: number;
  extractedCount: number;
  items: Array<{
    title: string;
    coverUrl?: string;
    mangaId?: string;
  }>;
  errorMessage?: string;
}

export interface RedisTelemetry {
  usedMemory: string;
  uptimeDays: number;
  connectedClients: number;
  totalSampledKeys: number;
  status: "connected" | "degraded" | "disconnected";
}

export interface RedisKeyItem {
  key: string;
  type: string;
  ttl: number;
}

export interface RedisKeyDetail extends RedisKeyItem {
  value: string;
}

export interface SearchIntelligenceStats {
  totalCatalogItems: number;
  totalCatalogRecords: number;
  embeddedRecordsCount: number;
  embeddingsActive: boolean;
  embeddingCoveragePercent: number;
  isGeminiConfigured: boolean;
  model: string;
  lastWarmedAt?: string;
}

export interface SearchSimulationResultItem {
  id: string;
  canonicalKey: string;
  title: string;
  sourceId: string;
  exactMatchScore: number;
  tagMatchScore: number;
  popularityScore: number;
  finalScore: number;
  hasEmbedding: boolean;
}

export interface SearchSimulationResult {
  query: string;
  semanticAvailable: boolean;
  catalogEmpty?: boolean;
  results: SearchSimulationResultItem[];
  rankedResults: SearchSimulationResultItem[];
}
