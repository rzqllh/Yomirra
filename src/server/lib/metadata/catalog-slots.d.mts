export interface CatalogSlot{origin:string;token:string;snapshot:string}
export interface CatalogSlots{primary:CatalogSlot;standby:CatalogSlot|null;pointer:boolean}
export interface CatalogFreshnessAttestation{
  schemaVersion:1;
  provider:"mangabaka";
  license:"CC-BY-NC-SA-4.0";
  sourceSha256:string;
  createdAt:string;
  createdAtMs:number;
  lastVerifiedAt:string;
  verifiedAtMs:number;
  officialSha1:string;
}
export const CATALOG_POINTER_KEY:string;
export const CATALOG_FRESHNESS_KEY_PREFIX:string;
export const MAX_CATALOG_FRESHNESS_MS:number;
export const SWITCH_CATALOG_LUA:string;
export const RENEW_CATALOG_FRESHNESS_LUA:string;
export function isSnapshot(value:unknown):value is string;
export function isOfficialSha1(value:unknown):value is string;
export function catalogFreshnessKey(snapshot:string):string;
export function configuredSlot(env:Record<string,string|undefined>,prefix:string):CatalogSlot|null;
export function catalogSlots(env:Record<string,string|undefined>):CatalogSlots|null;
export function selectCatalogSlot(slots:CatalogSlots|null,raw:unknown):CatalogSlot|null;
export function parseCatalogFreshnessAttestation(
  raw:unknown,
  options:{snapshot:string;createdAt?:string;now?:number}
):CatalogFreshnessAttestation;
export function encodeCatalogFreshnessAttestation(input:{
  sourceSha256:string;
  createdAt:string;
  lastVerifiedAt:string;
  officialSha1:string;
  now?:number;
}):{json:string;record:CatalogFreshnessAttestation;ttlMs:number};
