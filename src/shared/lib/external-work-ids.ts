import type { ExternalWorkIds } from "@/shared/sources/source-types";

const keys = ["anilist", "my_anime_list", "manga_updates"] as const;

/** IDs only. Do not accept arbitrary URLs, legacy numeric MU IDs or raw data. */
export function normalizeExternalWorkIds(input: unknown): ExternalWorkIds | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const values = input as Record<string, unknown>;
  const result: ExternalWorkIds = {};
  for (const key of keys) {
    const raw = values[key];
    if (typeof raw !== "string" && !(typeof raw === "number" && Number.isSafeInteger(raw))) continue;
    const id = String(raw).trim().toLowerCase();
    if (key === "manga_updates" ? /^(?=[a-z0-9]{1,32}$)(?=.*[a-z])[a-z0-9]+$/.test(id) : /^[1-9][0-9]{0,14}$/.test(id)) result[key] = id;
  }
  return Object.keys(result).length ? result : undefined;
}

export function compareExternalWorkIds(a?: ExternalWorkIds, b?: ExternalWorkIds): "match" | "conflict" | "unknown" {
  const left = normalizeExternalWorkIds(a);
  const right = normalizeExternalWorkIds(b);
  let shared = false;
  for (const key of keys) {
    if (!left?.[key] || !right?.[key]) continue;
    if (left[key] !== right[key]) return "conflict";
    shared = true;
  }
  return shared ? "match" : "unknown";
}
