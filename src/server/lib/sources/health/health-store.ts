import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import type { SourceHealthSnapshot, SourceHealthTransition, SourceHealthStatus } from "./types";

const SNAPSHOT_KEY_PREFIX = "yomirra:health:snapshot:";
const SNAPSHOT_TTL_SECONDS = 604800; // 7 days

type TransitionListener = (transition: SourceHealthTransition) => void | Promise<void>;

export class SourceHealthStore {
  private memorySnapshots = new Map<string, SourceHealthSnapshot>();
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
    if (redis) {
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

    if (redis) {
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

  async getAllSnapshots(): Promise<Record<string, SourceHealthSnapshot>> {
    const result: Record<string, SourceHealthSnapshot> = {};
    for (const [id, snap] of this.memorySnapshots.entries()) {
      result[id] = snap;
    }
    return result;
  }

  async clear(): Promise<void> {
    this.memorySnapshots.clear();
  }
}

export const sourceHealthStore = new SourceHealthStore();
