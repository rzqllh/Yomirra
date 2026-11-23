import {
  canonicalGroupPreferenceKey, canonicalGroupPreferenceAliases,
  groupVerifiedCatalogEntries, type CanonicalEvidenceEntry,
} from "./canonical-identity";

export interface AliasPreferenceConflict {
  canonicalId: string;
  guestSourceId: string;
  cloudSourceId: string;
  choices: string[];
}

export interface AliasPreferenceMergePlan {
  resolved: Record<string, string>;
  conflicts: AliasPreferenceConflict[];
  canCommit: boolean;
}

/**
 * Reconcile source preferences by verified identity, not by device-local
 * SavedTitleId. Exact provider references and explicitly CONFIRMED links can
 * connect guest and cloud aliases; title similarity is never sufficient.
 */
export function planVerifiedAliasPreferenceMerge(
  guest: Readonly<Record<string, string>>,
  cloud: Readonly<Record<string, string>>,
  guestLibrary: readonly CanonicalEvidenceEntry[],
  cloudLibrary: readonly CanonicalEvidenceEntry[],
  decisions: Readonly<Record<string, string>> = {},
): AliasPreferenceMergePlan {
  const groups = groupVerifiedCatalogEntries([...guestLibrary, ...cloudLibrary]);
  const aliases = new Map<string, string | null>();
  for (const group of groups) {
    const anchor = canonicalGroupPreferenceKey(group);
    for (const alias of canonicalGroupPreferenceAliases(group)) {
      if (!aliases.has(alias)) aliases.set(alias, anchor);
      else if (aliases.get(alias) !== anchor) aliases.set(alias, null);
    }
  }

  const guestChoices = new Map<string, Set<string>>();
  const cloudChoices = new Map<string, Set<string>>();
  const accumulate = (
    source: Readonly<Record<string, string>>,
    target: Map<string, Set<string>>,
  ) => {
    for (const [rawId, sourceId] of Object.entries(source)) {
      if (!sourceId || typeof sourceId !== "string" || !sourceId.trim()) continue;
      // An ambiguous SavedTitleId alias is not proof of identity.
      const canonicalId = aliases.get(rawId) ?? rawId;
      const choices = target.get(canonicalId) ?? new Set<string>();
      choices.add(sourceId);
      target.set(canonicalId, choices);
    }
  };
  accumulate(guest, guestChoices);
  accumulate(cloud, cloudChoices);

  const resolved = Object.create(null) as Record<string, string>;
  const conflicts: AliasPreferenceConflict[] = [];
  const canonicalIds = new Set([...guestChoices.keys(), ...cloudChoices.keys()]);
  for (const canonicalId of canonicalIds) {
    const guestValues = Array.from(guestChoices.get(canonicalId) ?? []);
    const cloudValues = Array.from(cloudChoices.get(canonicalId) ?? []);
    const choices = Array.from(new Set([...guestValues, ...cloudValues]));
    if (choices.length === 1) {
      resolved[canonicalId] = choices[0];
    } else if (choices.length > 1) {
      const decided = Object.hasOwn(decisions, canonicalId) ? decisions[canonicalId] : undefined;
      if (decided && choices.includes(decided)) {
        resolved[canonicalId] = decided;
      } else {
        conflicts.push({
          canonicalId,
          guestSourceId: guestValues[0] ?? choices[0],
          cloudSourceId: cloudValues[0] ?? choices[1],
          choices,
        });
      }
    }
  }
  return { resolved, conflicts, canCommit: conflicts.length === 0 };
}
