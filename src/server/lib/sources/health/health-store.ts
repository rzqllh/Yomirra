import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import type {
  SourceHealthSnapshot,
  SourceHealthTransition,
  SourceHealthStatus,
  SourceProbeSample,
  SourceRollingStats,
} from "./types";

const SNAPSHOT_KEY_PREFIX = "yomirra:health:snapshot:";
const SNAPSHOT_TTL_SECONDS = 604800; // 7 days
const HISTORY_KEY_PREFIX = "yomirra:health:history:";
const MAX_HISTORY_SAMPLES = 50;
const HISTORY_TTL_SECONDS = 604800; // 7 days (covers 24h rolling window safely)

type TransitionListener = (transition: SourceHealthTransition) => void | Promise<void>;

export class SourceHealthStore {
  private memorySnapshots = new Map<string, SourceHealthSnapshot>();
  private memoryHistory = new Map<string, SourceProbeSample[]>();
  private listeners: TransitionListener[] = [];

  /**
   * Register a listener for source health transitions (e.g. for future Telegram Ops alerts).
   */
  onTransition(listener: TransitionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Records a new health check result, calculates consecutive failure count,
   * detects status transitions (including SOURCE_RECOVERED), and updates the store.
   */
  async recordSnapshot(newSnapshot: SourceHealthSnapshot): Promise<SourceHealthTransition | null> {
    const sourceId = newSnapshot.sourceId.toLowerCase().trim();
    const prev = await this.getSnapshot(sourceId);

    const now = new Date().toISOString();
    let consecutiveFailures = 0;
    let lastSuccessAt = prev?.lastSuccessAt ?? null;
    let lastFailureAt = prev?.lastFailureAt ?? null;

    if (newSnapshot.status === "HEALTHY") {
      consecutiveFailures = 0;
      lastSuccessAt = now;
    } else {
      consecutiveFailures = (prev?.consecutiveFailures ?? 0) + 1;
      lastFailureAt = now;
    }

    const updatedSnapshot: SourceHealthSnapshot = {
      ...newSnapshot,
      consecutiveFailures,
      lastSuccessAt,
      lastFailureAt,
    };

    // Save in memory
    this.memorySnapshots.set(sourceId, updatedSnapshot);

    // Save in Redis if available
    if (isRedisConfigured) {
      try {
        await redis.setex(
          `${SNAPSHOT_KEY_PREFIX}${sourceId}`,
          SNAPSHOT_TTL_SECONDS,
          JSON.stringify(updatedSnapshot)
        );
      } catch (err) {
        logger.warn("Failed to persist source health snapshot to Redis", { sourceId, error: err });
      }
    }

    // Record probe sample in rolling history
    const sample: SourceProbeSample = {
      sourceId,
      timestamp: Date.now(),
      latencyMs: newSnapshot.latencyMs,
      status: newSnapshot.status,
      stage: newSnapshot.stage,
      probeType: newSnapshot.metadata?.probeType ?? "lightweight",
      errorCode: newSnapshot.lastFailureCode,
    };

    const existingHistory = this.memoryHistory.get(sourceId) || [];
    const updatedHistory = [sample, ...existingHistory].slice(0, MAX_HISTORY_SAMPLES);
    this.memoryHistory.set(sourceId, updatedHistory);

    if (isRedisConfigured) {
      try {
        const historyKey = `${HISTORY_KEY_PREFIX}${sourceId}`;
        await redis.lpush(historyKey, JSON.stringify(sample));
        await redis.ltrim(historyKey, 0, MAX_HISTORY_SAMPLES - 1);
        await redis.expire(historyKey, HISTORY_TTL_SECONDS);
      } catch (err) {
        logger.warn("Failed to persist source health probe sample to Redis", { sourceId, error: err });
      }
    }


    // Detect state transition
    let transition: SourceHealthTransition | null = null;
    const previousStatus: SourceHealthStatus = prev?.status ?? "UNKNOWN";
    const currentStatus = updatedSnapshot.status;

    if (previousStatus !== currentStatus) {
      let event: SourceHealthTransition["event"] = "STATUS_CHANGED";
      if ((previousStatus === "BROKEN" || previousStatus === "DEGRADED") && currentStatus === "HEALTHY") {
        event = "SOURCE_RECOVERED";
      } else if (currentStatus === "BROKEN") {
        event = "SOURCE_BROKEN";
      } else if (currentStatus === "DEGRADED") {
        event = "SOURCE_DEGRADED";
      }

      transition = {
        sourceId,
        previousStatus,
        currentStatus,
        event,
        snapshot: updatedSnapshot,
        timestamp: now,
      };

      // Notify listeners asynchronously
      for (const listener of this.listeners) {
        try {
          await listener(transition);
        } catch (err) {
          logger.error("Error executing health transition listener", { sourceId, error: err });
        }
      }
    }

    return transition;
  }

  async getSnapshot(sourceId: string): Promise<SourceHealthSnapshot | null> {
    const normalizedId = sourceId.toLowerCase().trim();

    if (isRedisConfigured) {
      try {
        const raw = await redis.get(`${SNAPSHOT_KEY_PREFIX}${normalizedId}`);
        if (raw) {
          return typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as SourceHealthSnapshot);
        }
      } catch {
        // fallback to memory
      }
    }

    return this.memorySnapshots.get(normalizedId) || null;
  }

  async getAllSnapshots(knownSourceIds?: string[]): Promise<Record<string, SourceHealthSnapshot>> {
    const result: Record<string, SourceHealthSnapshot> = {};
    for (const [id, snap] of this.memorySnapshots.entries()) {
      result[id] = snap;
    }

    if (knownSourceIds && isRedisConfigured) {
      for (const id of knownSourceIds) {
        const normalized = id.toLowerCase().trim();
        if (!result[normalized]) {
          const snap = await this.getSnapshot(normalized);
          if (snap) {
            result[normalized] = snap;
          }
        }
      }
    }

    return result;
  }

  async getRollingStats(sourceId: string, windowHours: number = 24): Promise<SourceRollingStats> {
    const normalizedId = sourceId.toLowerCase().trim();
    let samples: SourceProbeSample[] = [];

    if (isRedisConfigured) {
      try {
        const rawItems = await redis.lrange(`${HISTORY_KEY_PREFIX}${normalizedId}`, 0, MAX_HISTORY_SAMPLES - 1);
        if (rawItems && rawItems.length > 0) {
          samples = rawItems.map((item) => (typeof item === "string" ? JSON.parse(item) : item) as SourceProbeSample);
        }
      } catch (err) {
        logger.warn("Failed to read source health history from Redis, falling back to memory", {
          sourceId: normalizedId,
          error: err,
        });
      }
    }

    if (samples.length === 0) {
      samples = this.memoryHistory.get(normalizedId) || [];
    }

    const windowStart = Date.now() - windowHours * 60 * 60 * 1000;
    const validSamples = samples.filter((s) => s.timestamp >= windowStart);

    const totalSamples = validSamples.length;
    const hasSufficientData = totalSamples >= 3;
    const successfulSamples = validSamples.filter((s) => s.status === "HEALTHY").length;

    const successRate =
      hasSufficientData && totalSamples > 0
        ? `${((successfulSamples / totalSamples) * 100).toFixed(1)}%`
        : "-";

    // Calculate p95 latency from valid successful samples
    const successfulLatencies = validSamples
      .filter((s) => s.status === "HEALTHY" && s.latencyMs > 0)
      .map((s) => s.latencyMs)
      .sort((a, b) => a - b);

    let p95LatencyMs: number | null = null;
    let p95Latency = "-";

    if (hasSufficientData && successfulLatencies.length > 0) {
      const p95Index = Math.ceil(0.95 * successfulLatencies.length) - 1;
      p95LatencyMs = successfulLatencies[Math.max(0, p95Index)];
      p95Latency = `${p95LatencyMs}ms`;
    }

    const lastCheckedAt = validSamples[0] ? new Date(validSamples[0].timestamp).toISOString() : null;

    return {
      sourceId: normalizedId,
      totalSamples,
      successfulSamples,
      successRate,
      p95LatencyMs,
      p95Latency,
      lastCheckedAt,
      hasSufficientData,
    };
  }

  async clear(): Promise<void> {
    this.memorySnapshots.clear();
    this.memoryHistory.clear();
  }
}

export const sourceHealthStore = new SourceHealthStore();
