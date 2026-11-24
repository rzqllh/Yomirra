import { canonicalSourceKey, type CanonicalSourceIdentity, type CanonicalEvidenceEntry, type VerifiedCatalogGroup } from "./canonical-identity";

/** Version-controlled public work evidence. Only reviewed, provider-specific
 * identifiers may enter this registry; never import a user's saved links,
 * normalized titles or semantic-search suggestions into public identity.
 * Evidence is provenance, not a request to fetch a URL at runtime.
 */
export interface ReviewedCatalogWork {
  readonly workId: string;
  readonly bindings: readonly (CanonicalSourceIdentity & { readonly evidence: string })[];
}

/** No independently reviewed global mappings are supplied in the current
 * repository. Add entries with concrete publisher/provider evidence by review.
 * Empty is intentional: unverified works must remain separate.
 */
export const reviewedCatalogWorks: readonly ReviewedCatalogWork[] = [];

export function buildReviewedCatalogIndex(works: readonly ReviewedCatalogWork[]): ReadonlyMap<string, string> {
  const index = new Map<string, string>();
  const seenWorkIds = new Set<string>();
  for (const work of works) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(work.workId) || seenWorkIds.has(work.workId) || work.bindings.length < 2) {
      throw new Error("Invalid or duplicate reviewed catalog work");
    }
    seenWorkIds.add(work.workId);
    const providers = new Set<string>();
    for (const binding of work.bindings) {
      const ref = canonicalSourceKey(binding.sourceId, binding.mangaId);
      if (!binding.sourceId.trim() || !binding.mangaId.trim() || !binding.evidence.trim() ||
          providers.has(binding.sourceId) || index.has(ref)) {
        throw new Error("Invalid or conflicting reviewed catalog binding");
      }
      providers.add(binding.sourceId);
      index.set(ref, `global:${work.workId}`);
    }
  }
  return index;
}

const reviewedIndex = buildReviewedCatalogIndex(reviewedCatalogWorks);

export function getReviewedCatalogWork(workId: string, works: readonly ReviewedCatalogWork[] = reviewedCatalogWorks): ReviewedCatalogWork | undefined {
  return works.find(work => work.workId === workId);
}

export function getReviewedWorkHref(sourceId: string, mangaId: string, index: ReadonlyMap<string,string> = reviewedIndex): string | undefined {
  const identity = index.get(canonicalSourceKey(sourceId,mangaId));
  return identity?.startsWith("global:") ? "/catalog/work/"+encodeURIComponent(identity.slice(7)) : undefined;
}

export function getReviewedCatalogIndex(): ReadonlyMap<string, string> {
  return reviewedIndex;
}

/** Local confirmed links may supplement the projection for this user only.
 * Never bridge two globally reviewed works or change persisted identities.
 */
export function indexDiscoveryCatalog<T extends CanonicalEvidenceEntry>(
  groups: readonly VerifiedCatalogGroup<T>[],
  globalIndex: ReadonlyMap<string, string> = reviewedIndex,
): ReadonlyMap<string, string> {
  const result = new Map(globalIndex);
  for (const group of groups) {
    const refs = group.sourceBindings.map(ref => canonicalSourceKey(ref.sourceId, ref.mangaId));
    const globalIds = new Set(refs.flatMap(ref => globalIndex.has(ref) ? [globalIndex.get(ref)!] : []));
    if (globalIds.size > 1) continue;
    const identity = [...globalIds][0] ?? group.displayKey;
    for (const ref of refs) if (!globalIndex.has(ref)) result.set(ref, identity);
  }
  return result;
}
