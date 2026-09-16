import { useEffect, useState, useMemo } from "react";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

export type NsfwClassificationStatus = "LOADING" | "KNOWN" | "ERROR";

let cachedNsfwSourceIds: string[] | null = null;
let cachedStatus: NsfwClassificationStatus = "LOADING";
let fetchPromise: Promise<string[]> | null = null;

const CACHE_KEY = "yomirra_nsfw_classification_v1";

/**
 * Returns a set of source IDs that are NSFW, along with the classification status.
 * Fetches once and caches in module scope for the session.
 * Used to filter items from NSFW sources in bookmark/history pages.
 */
export function useNsfwSourceIds(): { status: NsfwClassificationStatus; ids: Set<string> } {
  const [ids, setIds] = useState<string[]>(cachedNsfwSourceIds ?? []);
  const [status, setStatus] = useState<NsfwClassificationStatus>(cachedStatus);

  useEffect(() => {
    if (cachedNsfwSourceIds !== null) {
      if (status !== cachedStatus) setStatus(cachedStatus);
      return;
    }

    // Try to load last known good classification from local storage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            cachedNsfwSourceIds = parsed;
            cachedStatus = "KNOWN";
            setIds(parsed);
            setStatus("KNOWN");
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    if (!fetchPromise) {
      fetchPromise = fetch("/api/sources/nsfw-ids")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch nsfw ids");
          return r.json();
        })
        .then((json) => {
          const result: string[] = Array.isArray(json.data) ? json.data : [];
          
          // Also include dynamic sources that are marked as NSFW
          const dynamicNsfwIds = dynamicSourceRegistry.getAll()
            .filter(s => s.isNsfw === true)
            .map(s => s.id);
          
          dynamicNsfwIds.forEach(id => {
            if (!result.includes(id)) {
              result.push(id);
            }
          });
          
          cachedNsfwSourceIds = result;
          cachedStatus = "KNOWN";
          
          if (typeof window !== "undefined") {
            localStorage.setItem(CACHE_KEY, JSON.stringify(result));
          }
          
          return result;
        })
        .catch(() => {
          fetchPromise = null; // allow retry on next mount
          // If we already had cached data from local storage, keep it as KNOWN
          if (cachedNsfwSourceIds) {
             return cachedNsfwSourceIds;
          }
          
          cachedStatus = "ERROR";
          return [];
        });
    }

    fetchPromise.then((result) => {
      setIds(result);
      setStatus(cachedStatus);
    });
  }, [status]);

  const memoizedSet = useMemo(() => new Set(ids), [ids]);

  return { status, ids: memoizedSet };
}
