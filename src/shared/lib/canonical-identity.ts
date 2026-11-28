/**
 * Read-only canonical grouping. A title or author match is not proof of identity.
 * Source records are never rewritten or removed by this module.
 */
export type CanonicalSourceIdentity = Readonly<{ sourceId: string; mangaId: string }>;

export type ConfirmedSourceIdentity = CanonicalSourceIdentity & Readonly<{
  matchConfidence: "CONFIRMED" | "HIGH_CONFIDENCE" | "AMBIGUOUS" | "NO_MATCH";
}>;

export interface CanonicalEvidenceEntry {
  id?: string;
  canonicalWorkId?: string;
  savedTitleAliases?: readonly string[];
  sourceId: string;
  mangaId: string;
  primarySourceId?: string;
  primaryMangaId?: string;
  linkedSources?: readonly ConfirmedSourceIdentity[];
}

export interface VerifiedCatalogGroup<T extends CanonicalEvidenceEntry> {
  /** Presentation identity only. Do not persist this as the canonical database ID. */
  displayKey: string;
  representative: T;
  members: readonly T[];
  sourceBindings: readonly CanonicalSourceIdentity[];
}

export function canonicalSourceKey(sourceId: string, mangaId: string): string {
  return JSON.stringify([sourceId, mangaId]);
}

export function provenReferences(item: CanonicalEvidenceEntry): CanonicalSourceIdentity[] {
  const refs: CanonicalSourceIdentity[] = [
    { sourceId: item.sourceId, mangaId: item.mangaId },
  ];
  if (item.primarySourceId && item.primaryMangaId) {
    refs.push({ sourceId: item.primarySourceId, mangaId: item.primaryMangaId });
  }
  for (const ref of item.linkedSources ?? []) {
    if (ref.matchConfidence === "CONFIRMED") refs.push(ref);
  }
  return refs.filter(ref => Boolean(ref.sourceId && ref.mangaId));
}

/**
 * Only a shared exact provider identity or an explicitly CONFIRMED linked source
 * may connect two saved entries. HIGH_CONFIDENCE title matching is never enough.
 * The result is a display projection; callers must preserve original records.
 */
export function groupVerifiedCatalogEntries<T extends CanonicalEvidenceEntry>(
  entries: readonly T[],
): VerifiedCatalogGroup<T>[] {
  const parents = entries.map((_, index) => index);
  const workIds = entries.map(entry => entry.canonicalWorkId);
  const find = (index: number): number => {
    let current = index;
    while (parents[current] !== current) current = parents[current];
    while (parents[index] !== index) {
      const next = parents[index];
      parents[index] = current;
      index = next;
    }
    return current;
  };
  const union = (left: number, right: number) => {
    const a = find(left);
    const b = find(right);
    if (a === b || (workIds[a] && workIds[b] && workIds[a] !== workIds[b])) return;
    parents[b] = a;
    workIds[a] ??= workIds[b];
  };
  const firstByRef = new Map<string, number>();
  entries.forEach((entry, index) => {
    for (const ref of provenReferences(entry)) {
      const key = canonicalSourceKey(ref.sourceId, ref.mangaId);
      const first = firstByRef.get(key);
      if (first === undefined) firstByRef.set(key, index);
      else union(index, first);
    }
  });

  const buckets = new Map<number, T[]>();
  entries.forEach((entry, index) => {
    const root = find(index);
    const bucket = buckets.get(root) ?? [];
    bucket.push(entry);
    buckets.set(root, bucket);
  });

  return Array.from(buckets.values()).map(members => {
    const refs = new Map<string, CanonicalSourceIdentity>();
    for (const member of members) {
      for (const ref of provenReferences(member)) {
        refs.set(canonicalSourceKey(ref.sourceId, ref.mangaId), ref);
      }
    }
    const keys = Array.from(refs.keys()).sort();
    return {
      // Stable for a given set of confirmed bindings. Not a persistent ID.
      displayKey: `verified-display:${keys[0] ?? "unknown"}`,
      representative: [...members].sort((a, b) =>
        (a.id ?? canonicalSourceKey(a.sourceId, a.mangaId)).localeCompare(
          b.id ?? canonicalSourceKey(b.sourceId, b.mangaId)
        )
      )[0],
      members,
      sourceBindings: Array.from(refs.values()),
    };
  });
}

/** Match an existing source-specific reading record to verified saved identity. */
export function indexVerifiedGroups<T extends CanonicalEvidenceEntry>(
  groups: readonly VerifiedCatalogGroup<T>[],
): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  groups.forEach(group => {
    group.sourceBindings.forEach(ref => {
      result.set(canonicalSourceKey(ref.sourceId, ref.mangaId), group.displayKey);
    });
  });
  return result;
}

/**
 * A deterministic preference anchor for a user's verified group. Unlike a title
 * slug, this uses saved identity/provenance; existing per-source IDs remain
 * readable through canonicalGroupPreferenceAliases during migration.
 *
 * If the membership changes, legacy aliases are still checked before the
 * preference is overwritten. Never use this display-derived ID as a global ID.
 */
export function canonicalGroupPreferenceKey<T extends CanonicalEvidenceEntry>(
  group: VerifiedCatalogGroup<T>,
): string {
  const ids = group.members.map(member => member.id).filter((id): id is string => Boolean(id));
  if (ids.length > 0) return [...ids].sort()[0];
  const refs = group.sourceBindings.map(ref => canonicalSourceKey(ref.sourceId, ref.mangaId)).sort();
  return `source:${refs[0] ?? "none"}`;
}

export function canonicalGroupPreferenceAliases<T extends CanonicalEvidenceEntry>(
  group: VerifiedCatalogGroup<T>,
): string[] {
  return Array.from(new Set([
    canonicalGroupPreferenceKey(group),
    ...group.members.flatMap(member => [
      member.id,
      ...(member.savedTitleAliases ?? []),
      `${member.sourceId}::${member.mangaId}`,
    ]).filter((id): id is string => Boolean(id)),
    ...group.sourceBindings.map(ref => `${ref.sourceId}::${ref.mangaId}`),
  ]));
}

export function resolveCanonicalGroupPreference<T extends CanonicalEvidenceEntry>(
  group: VerifiedCatalogGroup<T>,
  preferences: Readonly<Record<string, string>>,
) {
  const key = canonicalGroupPreferenceKey(group);
  const explicit = preferences[key];
  if (explicit) return { key, sourceId: explicit, conflict: false };

  const choices = new Set(canonicalGroupPreferenceAliases(group).map(alias => preferences[alias]).filter(Boolean));
  return { key, sourceId: choices.size === 1 ? choices.values().next().value : undefined, conflict: choices.size > 1 };
}
