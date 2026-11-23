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

function provenReferences(item: CanonicalEvidenceEntry): CanonicalSourceIdentity[] {
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
    if (a !== b) parents[b] = a;
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
      representative: members[0],
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
