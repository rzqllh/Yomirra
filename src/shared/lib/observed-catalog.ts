import { sourceRegistry } from "@/shared/sources/source-registry";
import { classifyContent } from "@/shared/sources/content-policy";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import type { MangaDetail } from "@/shared/sources/source-types";
import type { SourceBinding } from "./canonical-search";
import type { CanonicalSourceIdentity } from "./canonical-identity";
import { canonicalSourceKey } from "./canonical-identity";
import { extendCatalogEvidence } from "./catalog-evidence";

const MAX_BINDINGS = 4;
const MAX_QUERY_LENGTH = 1600;

function validRef(sourceId: unknown, mangaId: unknown): sourceId is string {
  if (typeof sourceId !== "string" || typeof mangaId !== "string" ||
      mangaId.length > 300 || !mangaId || !mangaId.split("/").every(part =>
        /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(part) && part !== "." && part !== "..")) return false;
  const source = sourceRegistry.find(s=>s.id===sourceId);
  return Boolean(source && !source.isDynamic && !source.isNsfw &&
    isDiscoverySourceSystemEligible(source) && source.capabilities.detail);
}

export function parseObservedCatalogRefs(raw: unknown): CanonicalSourceIdentity[] {
  if (typeof raw!=="string" || raw.length>MAX_QUERY_LENGTH) return [];
  try {
    const items:unknown=JSON.parse(raw);
    if (!Array.isArray(items) || items.length<2 || items.length>MAX_BINDINGS) return [];
    const refs:CanonicalSourceIdentity[]=[];
    for (const row of items) {
      if (!Array.isArray(row) || row.length!==2 || !validRef(row[0],row[1]) ||
          refs.some(ref=>ref.sourceId===row[0])) return [];
      refs.push({sourceId:row[0],mangaId:row[1] as string});
    }
    return refs;
  } catch {return [];}
}

export function observedCatalogBackHref(raw: unknown): string {
  if(typeof raw!=="string" || raw.length>800 || /[\u0000-\u001f\\]/.test(raw)) return "/search";
  const path=raw.split("?")[0];
  return ["/","/search","/library","/popular","/updates","/bookmark","/history"].includes(path) ? raw : "/search";
}

/** Only public, explicitly safe, bounded observations are passed to this
 * read-only route. URL contents are never authority for identity or access. */
export function getObservedCatalogHref(bindings:readonly SourceBinding[], returnTo?:string):string|undefined {
  if(bindings.length<2 || bindings.length>MAX_BINDINGS ||
      bindings.some(b=>classifyContent(b)!=="SAFE"))return undefined;
  const raw=JSON.stringify(bindings.map(b=>[b.sourceId,b.mangaId]));
  if(parseObservedCatalogRefs(raw).length!==bindings.length)return undefined;
  return "/catalog/observed?"+new URLSearchParams({refs:raw,returnTo:observedCatalogBackHref(returnTo)}).toString();
}

export interface ObservedCatalogDetail extends CanonicalSourceIdentity { detail:MangaDetail }

export function inspectObservedCatalog(refs:readonly CanonicalSourceIdentity[], details:readonly ObservedCatalogDetail[]){
  const visible=refs.flatMap(ref=>{
    const candidates=details.filter(row=>row.sourceId===ref.sourceId && row.mangaId===ref.mangaId &&
      row.detail.id===ref.mangaId && classifyContent(row.detail)==="SAFE");
    return candidates.length===1?candidates:[];
  });
  const index=extendCatalogEvidence(visible.map(row=>({sourceId:row.sourceId,manga:row.detail})));
  const ids=visible.map(row=>index.get(canonicalSourceKey(row.sourceId,row.mangaId)));
  const verified=visible.length===refs.length && visible.length>=2 && Boolean(ids[0]) && ids.every(id=>id===ids[0]);
  return {visible,verified,workKey:verified?ids[0]:undefined};
}
