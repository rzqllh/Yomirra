/**
 * A pure, non-destructive planning step for guest-to-cloud source preferences.
 * A conflict is resolved only by an explicit user decision; never by timestamps.
 * The caller must commit the result to cloud before applying it to local state.
 */
export type PreferredSourceMap = Readonly<Record<string, string>>;
export interface PreferredSourceConflict {
  canonicalId: string;
  guestSourceId: string;
  cloudSourceId: string;
}
export interface PreferredSourceMergePlan {
  /** Never persist this map until canCommit is true and remote writes succeeded. */
  resolved: Record<string, string>;
  conflicts: PreferredSourceConflict[];
  canCommit: boolean;
}

export function planPreferredSourceMerge(
  guest: PreferredSourceMap,
  cloud: PreferredSourceMap,
  decisions: PreferredSourceMap = {},
): PreferredSourceMergePlan {
  const resolved: Record<string, string> = Object.create(null) as Record<string, string>;
  const conflicts: PreferredSourceConflict[] = [];
  const keys = new Set([...Object.keys(cloud), ...Object.keys(guest)]);
  for (const canonicalId of keys) {
    const guestChoice = Object.hasOwn(guest, canonicalId) ? guest[canonicalId] : undefined;
    const cloudChoice = Object.hasOwn(cloud, canonicalId) ? cloud[canonicalId] : undefined;
    const guestSourceId = typeof guestChoice === "string" && guestChoice.trim() ? guestChoice : undefined;
    const cloudSourceId = typeof cloudChoice === "string" && cloudChoice.trim() ? cloudChoice : undefined;
    if (guestSourceId && cloudSourceId && guestSourceId !== cloudSourceId) {
      const decision = Object.hasOwn(decisions, canonicalId) ? decisions[canonicalId] : undefined;
      if (decision === guestSourceId || decision === cloudSourceId) {
        resolved[canonicalId] = decision;
      } else {
        conflicts.push({ canonicalId, guestSourceId, cloudSourceId });
      }
      continue;
    }
    const choice = guestSourceId || cloudSourceId;
    if (choice) resolved[canonicalId] = choice;
  }
  return { resolved, conflicts, canCommit: conflicts.length === 0 };
}
