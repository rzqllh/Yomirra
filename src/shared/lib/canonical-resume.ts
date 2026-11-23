import { canonicalSourceKey, type CanonicalSourceIdentity } from "./canonical-identity";

export interface CanonicalResumePosition extends CanonicalSourceIdentity {
  chapterId: string;
  readAt: number;
}

export type CanonicalResumeDecision =
  | { action: "resume"; source: CanonicalSourceIdentity; chapterId?: string; reason: "preferred" | "last-read" | "only-source" }
  | { action: "pick-source"; reason: "preferred-unavailable" | "multiple-sources" | "no-eligible-source" }
  | { action: "offline"; reason: "no-cached-preferred" | "no-cached-source" };

/**
 * Pure routing policy: no implicit preference writes, no cross-source chapter
 * translation, and no false source-outage decisions from a device going offline.
 */
export function resolveCanonicalResume(options: {
  bindings: readonly CanonicalSourceIdentity[];
  preferredSourceId?: string | null;
  lastRead?: readonly CanonicalResumePosition[];
  disabledSourceIds?: readonly string[];
  unavailableSourceIds?: readonly string[];
  deviceOffline?: boolean;
  cachedSourceRefs?: readonly CanonicalSourceIdentity[];
}): CanonicalResumeDecision {
  const {
    bindings, preferredSourceId, lastRead = [], disabledSourceIds = [],
    unavailableSourceIds = [], deviceOffline = false, cachedSourceRefs = [],
  } = options;
  const disabled = new Set(disabledSourceIds);
  const unavailable = new Set(unavailableSourceIds);
  const available = bindings.filter(binding =>
    !disabled.has(binding.sourceId) && !unavailable.has(binding.sourceId)
  );
  const cached = new Set(cachedSourceRefs.map(ref => canonicalSourceKey(ref.sourceId, ref.mangaId)));
  const eligible = deviceOffline
    ? available.filter(ref => cached.has(canonicalSourceKey(ref.sourceId, ref.mangaId)))
    : available;

  if (preferredSourceId) {
    const preferredBindings = bindings.filter(binding => binding.sourceId === preferredSourceId);
    const preferredAvailable = available.filter(binding => binding.sourceId === preferredSourceId);
    if (preferredBindings.length !== 1 || preferredAvailable.length !== 1) {
      return { action: "pick-source", reason: "preferred-unavailable" };
    }
    const chosen = preferredAvailable[0];
    if (deviceOffline && !cached.has(canonicalSourceKey(chosen.sourceId, chosen.mangaId))) {
      return { action: "offline", reason: "no-cached-preferred" };
    }
    const cursor = lastRead.filter(item =>
      item.sourceId === chosen.sourceId && item.mangaId === chosen.mangaId
    ).sort((a, b) => b.readAt - a.readAt)[0];
    return { action: "resume", source: chosen, chapterId: cursor?.chapterId, reason: "preferred" };
  }

  const latest = [...lastRead].sort((a, b) => b.readAt - a.readAt)
    .find(item => eligible.some(ref => ref.sourceId === item.sourceId && ref.mangaId === item.mangaId));
  if (latest) {
    return { action: "resume", source: { sourceId: latest.sourceId, mangaId: latest.mangaId }, chapterId: latest.chapterId, reason: "last-read" };
  }
  if (deviceOffline && eligible.length === 0) return { action: "offline", reason: "no-cached-source" };
  if (eligible.length === 1) return { action: "resume", source: eligible[0], reason: "only-source" };
  return { action: "pick-source", reason: eligible.length ? "multiple-sources" : "no-eligible-source" };
}
