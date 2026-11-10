import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useLibraryStore } from "./library-store";

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENT_FETCHES = 2;

export interface CoverResolutionEntry {
  coverUrl: string;
  status: "RESOLVED" | "FAILED" | "PENDING";
  source: "initial" | "library" | "upstream";
  retryCount: number;
  lastAttemptAt: number;
}

interface CoverCacheState {
  resolutions: Record<string, CoverResolutionEntry>;
  getResolvedCover: (sourceId: string, mangaId: string) => string | null;
  setResolvedCover: (
    sourceId: string,
    mangaId: string,
    coverUrl: string,
    source?: "library" | "upstream"
  ) => void;
  markFailed: (sourceId: string, mangaId: string) => void;
  isFailedCooldown: (sourceId: string, mangaId: string) => boolean;
  clearExpired: () => void;
}

export const useCoverCacheStore = create<CoverCacheState>()(
  persist(
    (set, get) => ({
      resolutions: {},

      getResolvedCover: (sourceId, mangaId) => {
        const key = `${sourceId}::${mangaId}`;
        const entry = get().resolutions[key];
        if (!entry) return null;
        if (entry.status === "RESOLVED" && entry.coverUrl) {
          return entry.coverUrl;
        }
        return null;
      },

      setResolvedCover: (sourceId, mangaId, coverUrl, source = "upstream") => {
        if (!coverUrl) return;
        const key = `${sourceId}::${mangaId}`;
        set((state) => ({
          resolutions: {
            ...state.resolutions,
            [key]: {
              coverUrl,
              status: "RESOLVED",
              source,
              retryCount: 0,
              lastAttemptAt: Date.now(),
            },
          },
        }));
      },

      markFailed: (sourceId, mangaId) => {
        const key = `${sourceId}::${mangaId}`;
        const existing = get().resolutions[key];
        const count = (existing?.retryCount ?? 0) + 1;
        set((state) => ({
          resolutions: {
            ...state.resolutions,
            [key]: {
              coverUrl: existing?.coverUrl || "",
              status: "FAILED",
              source: existing?.source || "initial",
              retryCount: count,
              lastAttemptAt: Date.now(),
            },
          },
        }));
      },

      isFailedCooldown: (sourceId, mangaId) => {
        const key = `${sourceId}::${mangaId}`;
        const entry = get().resolutions[key];
        if (!entry || entry.status !== "FAILED") return false;
        if (entry.retryCount >= 2) {
          const elapsed = Date.now() - entry.lastAttemptAt;
          return elapsed < COOLDOWN_MS;
        }
        return false;
      },

      clearExpired: () => {
        const now = Date.now();
        set((state) => {
          const next: Record<string, CoverResolutionEntry> = {};
          for (const [k, v] of Object.entries(state.resolutions)) {
            if (v.status === "FAILED" && now - v.lastAttemptAt > COOLDOWN_MS) {
              continue; // prune expired failure cooldowns
            }
            next[k] = v;
          }
          return { resolutions: next };
        });
      },
    }),
    {
      name: "yomirra-cover-cache",
      partialize: (state) => ({
        resolutions: state.resolutions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.clearExpired();
      },
    }
  )
);

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<string | null>>();
let activeFetchCount = 0;
const fetchQueue: (() => void)[] = [];

function acquireFetchSlot(): Promise<void> {
  if (activeFetchCount < MAX_CONCURRENT_FETCHES) {
    activeFetchCount++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    fetchQueue.push(() => {
      activeFetchCount++;
      resolve();
    });
  });
}

function releaseFetchSlot(): void {
  activeFetchCount--;
  const next = fetchQueue.shift();
  if (next) {
    next();
  }
}

/**
 * 4-Tier Waterfall Cover Resolver (Client-Only, Zero Cloud Sync Mutations)
 * Tier 0: Direct coverUrl if not failed
 * Tier 1: Local coverCacheStore
 * Tier 2: Local libraryStore item
 * Tier 3: Bounded Upstream Fetch via internal API with concurrency limiter
 * Tier 4: Null (graceful branded fallback)
 */
export async function resolveMangaCover(
  sourceId: string,
  mangaId: string,
  initialCoverUrl?: string
): Promise<string | null> {
  if (!sourceId || !mangaId) return initialCoverUrl || null;

  const store = useCoverCacheStore.getState();

  // If in active 24h failure cooldown, skip network calls
  if (store.isFailedCooldown(sourceId, mangaId)) {
    return null;
  }

  // Tier 1: Local cover resolution cache
  const cached = store.getResolvedCover(sourceId, mangaId);
  if (cached) {
    return cached;
  }

  // Tier 2: Check libraryStore for fresh metadata
  try {
    const libState = useLibraryStore.getState();
    const libItem = libState.getLibraryItem?.(sourceId, mangaId);
    if (libItem?.coverUrl && libItem.coverUrl !== initialCoverUrl) {
      store.setResolvedCover(sourceId, mangaId, libItem.coverUrl, "library");
      return libItem.coverUrl;
    }
  } catch {
    // Non-blocking library store check
  }

  // Deduplicate in-flight requests for same sourceId::mangaId
  const key = `${sourceId}::${mangaId}`;
  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  // Tier 3: Bounded Upstream Fetch
  const fetchPromise = (async (): Promise<string | null> => {
    await acquireFetchSlot();
    try {
      const url = `/api/sources/${encodeURIComponent(sourceId)}/manga/${encodeURIComponent(mangaId)}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        store.markFailed(sourceId, mangaId);
        return null;
      }

      const data = (await res.json()) as { coverUrl?: string; data?: { coverUrl?: string } };
      const resolvedUrl = data.coverUrl || data.data?.coverUrl;

      if (resolvedUrl && typeof resolvedUrl === "string") {
        store.setResolvedCover(sourceId, mangaId, resolvedUrl, "upstream");
        return resolvedUrl;
      } else {
        store.markFailed(sourceId, mangaId);
        return null;
      }
    } catch {
      store.markFailed(sourceId, mangaId);
      return null;
    } finally {
      releaseFetchSlot();
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}
