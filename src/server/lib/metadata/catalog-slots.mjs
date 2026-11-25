/** Shared runtime/operator slot contract; credentials never enter the pointer. */
export const CATALOG_POINTER_KEY="yomirra:catalog:active-snapshot:v1";
export const isSnapshot=value=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
export function configuredSlot(env,prefix){
  const token=env[prefix+"_READ_TOKEN"];
  const snapshot=env[prefix+"_SNAPSHOT"];
  if(typeof token!=="string"||!token.trim()||!isSnapshot(snapshot))return null;
  try{
    const u=new URL((env[prefix+"_URL"]??"").replace(/^(?:libsql|turso):\/\//,"https://"));
    if(u.protocol!=="https:"||u.username||u.password||u.port||u.search||u.hash||u.pathname!=="/"||
       !/^[a-z0-9-]+\.turso\.io$/.test(u.hostname))return null;
    return {origin:u.origin,token,snapshot};
  }catch{return null;}
}
export function catalogSlots(env){
  if(env.YOMIRRA_MANGABAKA_METADATA!=="permitted"||env.YOMIRRA_TURSO_FREE_CONFIRMED!=="yes")return null;
  const primary=configuredSlot(env,"YOMIRRA_TURSO");
  if(!primary)return null;
  if(env.YOMIRRA_TURSO_POINTER_ENABLED!=="yes")return {primary,standby:null,pointer:false};
  const standby=configuredSlot(env,"YOMIRRA_TURSO_STANDBY");
  if(!standby||standby.origin===primary.origin||standby.snapshot===primary.snapshot)return null;
  return {primary,standby,pointer:true};
}
export function selectCatalogSlot(slots,raw){
  if(!slots)return null;
  if(!slots.pointer)return slots.primary;
  if(raw===null||raw===slots.primary.snapshot)return slots.primary;
  if(raw===slots.standby?.snapshot)return slots.standby;
  return null;
}
export const SWITCH_CATALOG_LUA=`
local current=redis.call('GET',KEYS[1])
if not current then current=ARGV[3] end
if current~=ARGV[1] then return 0 end
redis.call('SET',KEYS[1],ARGV[2])
return 1
`;
