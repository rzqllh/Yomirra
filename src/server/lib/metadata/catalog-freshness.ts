import {isRedisConfigured,isRedisCommandAllowed,redis} from "@/server/lib/cache/redis";
import {
  catalogFreshnessKey,
  isSnapshot,
  MAX_CATALOG_FRESHNESS_MS,
  parseCatalogFreshnessAttestation,
} from "./catalog-slots.mjs";

type FreshnessObservation=
  | {state:"absent"}
  | {state:"unavailable"}
  | {state:"present";raw:string};

const observed=new Map<string,{until:number;value:FreshnessObservation}>();
const flights=new Map<string,Promise<FreshnessObservation>>();

export function resetCatalogFreshnessForTests(){
  observed.clear();
  flights.clear();
}

async function observeCatalogFreshness(snapshot:string):Promise<FreshnessObservation>{
  if(!isSnapshot(snapshot))return {state:"unavailable"};
  if(!isRedisConfigured||!isRedisCommandAllowed())return {state:"unavailable"};
  const now=Date.now();
  const cached=observed.get(snapshot);
  if(cached&&cached.until>now)return cached.value;
  const existing=flights.get(snapshot);
  if(existing)return existing;
  const promise=(async():Promise<FreshnessObservation>=>{
    let value:FreshnessObservation={state:"unavailable"};
    try{
      const raw=await redis.get(catalogFreshnessKey(snapshot));
      if(raw===null)value={state:"absent"};
      else if(typeof raw==="string")value={state:"present",raw};
    }catch{
      value={state:"unavailable"};
    }
    if(observed.size>=16)observed.clear();
    observed.set(snapshot,{
      until:Date.now()+(value.state==="unavailable"?5000:30000),
      value,
    });
    return value;
  })();
  flights.set(snapshot,promise);
  try{return await promise;}finally{if(flights.get(snapshot)===promise)flights.delete(snapshot);}
}

/**
 * Separates immutable dataset identity (`source_sha256` and `created_at`) from
 * evidence-based freshness verification (`last_verified_at` + `official_sha1`).
 *
 * - Rejects malformed, mismatched, expired, or future-dated attestations immediately,
 *   even when `created_at` is still within 7 days.
 * - Requires a valid Redis attestation once `created_at` exceeds 7 days; missing or
 *   unavailable evidence fails closed.
 */
export async function resolveCatalogVerifiedAt(input:{
  snapshot:string;
  createdAt:string;
  now?:number;
}):Promise<number>{
  const now=input.now??Date.now();
  if(!isSnapshot(input.snapshot)||!Number.isFinite(now))throw Error("Catalog snapshot invalid");
  const createdAtMs=Date.parse(input.createdAt);
  if(!Number.isFinite(createdAtMs)||createdAtMs>now)throw Error("Catalog snapshot invalid or future-dated");
  const ageMs=now-createdAtMs;
  const obs=await observeCatalogFreshness(input.snapshot);
  if(obs.state==="present"){
    const attested=parseCatalogFreshnessAttestation(obs.raw,{
      snapshot:input.snapshot,
      createdAt:input.createdAt,
      now,
    });
    return Math.max(createdAtMs,attested.verifiedAtMs);
  }
  if(ageMs<=MAX_CATALOG_FRESHNESS_MS)return createdAtMs;
  throw Error(obs.state==="absent"?"Catalog snapshot expired":"Catalog freshness attestation unavailable");
}
