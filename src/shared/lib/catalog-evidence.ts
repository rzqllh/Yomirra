import type { MangaItem } from "@/shared/sources/source-types";
import { classifyContent } from "@/shared/sources/content-policy";
import { normalizeTitle } from "./title-matcher";
import { compareExternalWorkIds, normalizeExternalWorkIds } from "./external-work-ids";

type Observation = {sourceId:string;manga:MangaItem};
const ref = (row:Observation) => JSON.stringify([row.sourceId,row.manga.id]);
const namespaces = ["anilist","my_anime_list","manga_updates"] as const;

/** Reversible projection over trusted adapter observations. No title-only match,
 * no transitive bridges, no persistent bookmark or chapter rewrites. A tracker
 * namespace may establish a group only when ALL rows agree on that identifier.
 * Existing reviewed/local evidence is never overwritten by automatic evidence.
 */
export function extendCatalogEvidence(
  observations: readonly Observation[],
  reviewed: ReadonlyMap<string,string> = new Map(),
): ReadonlyMap<string,string> {
  const result = new Map(reviewed);
  const unique = new Map<string,Observation>();
  const conflicts = new Set<string>();
  for (const row of observations) {
    if (!row.sourceId || !row.manga?.id || !row.manga.title) continue;
    const key = ref(row);
    const previous = unique.get(key);
    if (previous) {
      if (compareExternalWorkIds(previous.manga.externalWorkIds,row.manga.externalWorkIds)==="conflict" ||
          classifyContent(previous.manga)!==classifyContent(row.manga) ||
          normalizeTitle(previous.manga.format)!==normalizeTitle(row.manga.format)) conflicts.add(key);
      continue; // Live/first observation wins; stale data cannot add identity.
    }
    unique.set(key,row);
  }
  const buckets = new Map<string,Observation[]>();
  for (const row of unique.values()) {
    if (classifyContent(row.manga)!=="SAFE") continue;
    const format = normalizeTitle(row.manga.format);
    if (!["manga","manhwa","manhua"].includes(format)) continue;
    const ids = normalizeExternalWorkIds(row.manga.externalWorkIds);
    for (const namespace of namespaces) {
      const id = ids?.[namespace];
      if (!id) continue;
      const key = JSON.stringify([namespace,id,format]);
      const group = buckets.get(key) ?? [];
      group.push(row);
      buckets.set(key,group);
    }
  }
  const viable = [...buckets.entries()].filter(([,group]) => {
    if (group.length < 2 || new Set(group.map(row=>row.sourceId)).size!==group.length ||
        group.some(row=>conflicts.has(ref(row)) || reviewed.has(ref(row)))) return false;
    const authors = new Set(group.map(row=>normalizeTitle(row.manga.author)).filter(Boolean));
    return authors.size <= 1 && group.every((row,i)=>group.slice(i+1).every(other=>
      compareExternalWorkIds(row.manga.externalWorkIds,other.manga.externalWorkIds)==="match"));
  });
  // Any overlap with a different member set is ambiguous, even if a third
  // provider supplies both trackers. Do not choose one group by arrival order.
  const signatures = new Map<string,Set<string>>();
  for (const [,group] of viable) {
    const signature = JSON.stringify(group.map(ref).sort());
    for (const row of group) {
      const memberships = signatures.get(ref(row)) ?? new Set<string>();
      memberships.add(signature);
      signatures.set(ref(row),memberships);
    }
  }
  const assigned = new Set<string>();
  for (const [key,group] of viable.sort(([a],[b])=>a.localeCompare(b))) {
    if (group.some(row=>(signatures.get(ref(row))?.size??0)!==1 || assigned.has(ref(row)))) continue;
    for (const row of group) {result.set(ref(row),"tracker:"+key);assigned.add(ref(row));}
  }
  return result;
}
