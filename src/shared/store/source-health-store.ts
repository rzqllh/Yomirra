import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HealthStatus = "online" | "slow" | "degraded" | "offline" | "unknown";

export interface SourceHealth {
  status: HealthStatus;
  latencyMs: number;
  lastSuccessAt: number;
  lastErrorAt?: number;
  consecutiveFailures: number;
  lastErrorMessage?: string;
}

interface SourceHealthState {
  healthBySource: Record<string, SourceHealth>;
  recordSuccess: (sourceId: string, latencyMs: number) => void;
  recordError: (sourceId: string, error: Error) => void;
  getHealth: (sourceId: string) => SourceHealth;
}

const DEFAULT_HEALTH: SourceHealth = {
  status: "unknown",
  latencyMs: 0,
  lastSuccessAt: 0,
  consecutiveFailures: 0,
};

export const useSourceHealthStore = create<SourceHealthState>()(
  persist(
    (set, get) => ({
      healthBySource: {},

      recordSuccess: (sourceId, latencyMs) => set((state) => {
        const current = state.healthBySource[sourceId] || DEFAULT_HEALTH;
        // Moving average for latency (e.g., 70% new, 30% old)
        const avgLatency = current.latencyMs === 0 ? latencyMs : (latencyMs * 0.7) + (current.latencyMs * 0.3);
        
        let newStatus: HealthStatus = "online";
        if (avgLatency > 5000) newStatus = "slow";
        
        if (newStatus !== current.status && (current.status === "offline" || current.status === "degraded") && typeof window !== "undefined") {
          // Fire non-blocking recovery alert
          fetch("/api/observability/alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId,
              oldStatus: current.status,
              newStatus,
              message: "Source recovered",
            }),
          }).catch(console.error);
        }

        return {
          healthBySource: {
            ...state.healthBySource,
            [sourceId]: {
              ...current,
              status: newStatus,
              latencyMs: Math.round(avgLatency),
              lastSuccessAt: Date.now(),
              consecutiveFailures: 0, // Reset failures on success
            }
          }
        };
      }),

      recordError: (sourceId, error) => set((state) => {
        const current = state.healthBySource[sourceId] || DEFAULT_HEALTH;
        const failures = current.consecutiveFailures + 1;
        
        let newStatus: HealthStatus = current.status;
        if (failures >= 3) {
          newStatus = "offline";
        } else if (failures > 0) {
          newStatus = "degraded";
        }

        if (newStatus !== current.status && newStatus !== "unknown" && typeof window !== "undefined") {
          // Fire non-blocking alert
          fetch("/api/observability/alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId,
              oldStatus: current.status,
              newStatus,
              message: error.message || "Unknown error",
            }),
          }).catch(console.error);
        }

        return {
          healthBySource: {
            ...state.healthBySource,
            [sourceId]: {
              ...current,
              status: newStatus,
              lastErrorAt: Date.now(),
              consecutiveFailures: failures,
              lastErrorMessage: error.message || "Unknown error",
            }
          }
        };
      }),

      getHealth: (sourceId) => {
        return get().healthBySource[sourceId] || DEFAULT_HEALTH;
      }
    }),
    {
      name: "yomirra-source-health",
      version: 1,
    }
  )
);
