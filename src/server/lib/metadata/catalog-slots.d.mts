export interface CatalogSlot{origin:string;token:string;snapshot:string}
export interface CatalogSlots{primary:CatalogSlot;standby:CatalogSlot|null;pointer:boolean}
export const CATALOG_POINTER_KEY:string;
export const SWITCH_CATALOG_LUA:string;
export function isSnapshot(value:unknown):value is string;
export function configuredSlot(env:Record<string,string|undefined>,prefix:string):CatalogSlot|null;
export function catalogSlots(env:Record<string,string|undefined>):CatalogSlots|null;
export function selectCatalogSlot(slots:CatalogSlots|null,raw:unknown):CatalogSlot|null;
