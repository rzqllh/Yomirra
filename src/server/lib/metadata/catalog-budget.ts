import {isRedisConfigured,isRedisCommandAllowed,redis} from "@/server/lib/cache/redis";
export const CATALOG_DAILY_CAP=1000;
// Optional catalogue cache misses only. This is NOT a provider billing meter.
// Fail closed when the shared admission ledger is unavailable; reading
// existing sources does not depend on this optional budget.
const RESERVE_SCRIPT=String.raw`
local v=tonumber(redis.call('GET',KEYS[1]) or '0')
local cap=tonumber(ARGV[1])
if not v or v<0 or v>=cap then return 0 end
redis.call('SET',KEYS[1],v+1,'EX',172800)
return 1
`;
export function catalogBudgetKey(now=new Date()){
  return "yomirra:catalog:admission:"+now.toISOString().slice(0,10);
}
export async function reserveCatalogRequest():Promise<boolean>{
  if(!isRedisConfigured||!isRedisCommandAllowed())return false;
  try{return Number(await redis.eval(RESERVE_SCRIPT,1,catalogBudgetKey(),CATALOG_DAILY_CAP))===1;}catch{return false;}
}
export async function catalogBudgetSummary():Promise<string>{
  if(process.env.YOMIRRA_TURSO_FREE_CONFIRMED!=="yes")return "Katalog Turso: belum diaktifkan.";
  if(!isRedisConfigured||!isRedisCommandAllowed())return "Katalog Turso: ledger tidak tersedia; akses tambahan dijeda.";
  try{
    const raw=await redis.get(catalogBudgetKey());
    const count=Number(raw??0);
    if(!Number.isSafeInteger(count)||count<0)throw Error("Invalid count");
    return "Katalog Turso: "+count+"/"+CATALOG_DAILY_CAP+" cache miss (UTC), "+(count>=CATALOG_DAILY_CAP?"dijeda":count>=CATALOG_DAILY_CAP*.8?"mendekati batas":"batas lokal tersedia")+".";
  }catch{return "Katalog Turso: penggunaan lokal tidak terverifikasi.";}
}
