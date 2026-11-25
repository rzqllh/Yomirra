import {createHash} from "node:crypto";
import {isRedisConfigured,isRedisCommandAllowed,redis} from "@/server/lib/cache/redis";
import {catalogSlots,selectCatalogSlot,CATALOG_POINTER_KEY,type CatalogSlot} from "./catalog-slots.mjs";

let observed:{key:string;until:number;slot:CatalogSlot|null}|undefined;
let flight:{key:string;promise:Promise<CatalogSlot|null>}|undefined;
export function isTursoCatalogConfigured(){return catalogSlots(process.env)!==null;}
export function resetCatalogPointerForTests(){observed=undefined;flight=undefined;}
export async function currentTursoCatalog():Promise<CatalogSlot|null>{
  const slots=catalogSlots(process.env);
  if(!slots)return null;
  if(!slots.pointer)return slots.primary;
  if(!isRedisConfigured||!isRedisCommandAllowed())return null;
  const key=createHash("sha256").update(JSON.stringify(slots)).digest("hex");
  const now=Date.now();
  if(observed?.key===key&&observed.until>now)return observed.slot;
  if(flight?.key===key)return flight.promise;
  const promise=(async()=>{
    let slot:CatalogSlot|null=null;
    try{slot=selectCatalogSlot(slots,await redis.get(CATALOG_POINTER_KEY));}catch{}
    observed={key,until:Date.now()+(slot?30000:5000),slot};
    return slot;
  })();
  flight={key,promise};
  try{return await promise;}finally{if(flight?.promise===promise)flight=undefined;}
}
