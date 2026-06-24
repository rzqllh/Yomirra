import { useEffect, useState } from "react";

let cachedNsfwSourceIds: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

/**
 * Returns a set of source IDs that are NSFW.
 * Fetches once and caches in module scope for the session.
 * Used to filter items from NSFW sources in bookmark/history pages.
 */
export function useNsfwSourceIds(): Set<string> {
  const [ids, setIds] = useState<string[]>(cachedNsfwSourceIds ?? []);

  useEffect(() => {
    if (cachedNsfwSourceIds !== null) {
      setIds(cachedNsfwSourceIds);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch("/api/sources/nsfw-ids")
        .then((r) => r.json())
        .then((json) => {
          const result: string[] = Array.isArray(json.data) ? json.data : [];
          cachedNsfwSourceIds = result;
          return result;
        })
        .catch(() => {
          fetchPromise = null; // allow retry on next mount
          return [];
        });
    }

    fetchPromise.then((result) => {
      setIds(result);
    });
  }, []);

  return new Set(ids);
}
