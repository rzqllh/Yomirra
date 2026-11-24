import {isRedisConfigured,isRedisCommandAllowed,redis} from "./redis";

export const OPTIONAL_SERVICE_CAPS={mangabaka:300,gemini:100,mangaupdates:100} as const;
export type OptionalService=keyof typeof OPTIONAL_SERVICE_CAPS;

// Local application admissions, not provider account usage or billing quotas.
// Separate keys prevent optional services exhausting one another's allowance.
const RESERVE_SCRIPT=`
local v=tonumber(redis.call('GET',KEYS[1]) or '0')
local cap=tonumber(ARGV[1])
if not v or v<0 or v%1~=0 or v>=cap then return 0 end
redis.call('SET',KEYS[1],v+1,'EX',172800)
return 1
`;
export function optionalServiceKey(service:OptionalService,now=new Date()){
  return "yomirra:optional:admission:"+service+":"+now.toISOString().slice(0,10);
}
export async function reserveOptionalService(service:OptionalService):Promise<boolean>{
  if(service==="gemini"&&process.env.YOMIRRA_GEMINI_FREE_CONFIRMED!=="yes")return false;
  if(service==="mangaupdates"&&process.env.YOMIRRA_MANGAUPDATES_METADATA!=="permitted")return false;
  if(!isRedisConfigured||!isRedisCommandAllowed())return false;
  try{return Number(await redis.eval(RESERVE_SCRIPT,1,optionalServiceKey(service),OPTIONAL_SERVICE_CAPS[service]))===1;}catch{return false;}
}
export async function optionalServiceSummary(service:OptionalService):Promise<string>{
  const label=service==="gemini"?"Gemini":service==="mangaupdates"?"MangaUpdates API":"MangaBaka API";
  if(service==="gemini"&&process.env.YOMIRRA_GEMINI_FREE_CONFIRMED!=="yes")return label+": permintaan baru dijeda (free tier belum dikonfirmasi).";
  if(service==="mangabaka"&&process.env.YOMIRRA_MANGABAKA_METADATA!=="permitted")return label+": belum diaktifkan.";
  if(service==="mangaupdates"&&process.env.YOMIRRA_MANGAUPDATES_METADATA!=="permitted")return label+": belum diaktifkan.";
  if(!isRedisConfigured||!isRedisCommandAllowed())return label+": ledger tidak tersedia; permintaan baru dijeda.";
  try{
    const count=Number(await redis.get(optionalServiceKey(service))??0),cap=OPTIONAL_SERVICE_CAPS[service];
    if(!Number.isSafeInteger(count)||count<0)throw Error("Invalid count");
    return label+": "+count+"/"+cap+" permintaan (UTC), "+(count>=cap?"dijeda":count>=cap*.8?"mendekati batas":"batas lokal tersedia")+".";
  }catch{return label+": penggunaan lokal tidak terverifikasi.";}
}
