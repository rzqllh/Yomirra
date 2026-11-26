/** Shared runtime/operator slot and freshness contract; credentials never enter Redis keys or payloads. */
export const CATALOG_POINTER_KEY="yomirra:catalog:active-snapshot:v1";
export const CATALOG_FRESHNESS_KEY_PREFIX="yomirra:catalog:freshness:v1:";
export const MAX_CATALOG_FRESHNESS_MS=7*24*60*60*1000;
export const isSnapshot=value=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
export const isOfficialSha1=value=>typeof value==="string"&&/^[a-f0-9]{40}$/.test(value);
const ISO_UTC_RE=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$/;
export function catalogFreshnessKey(snapshot){
  if(!isSnapshot(snapshot))throw Error("Invalid catalog snapshot identifier");
  return CATALOG_FRESHNESS_KEY_PREFIX+snapshot;
}
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
export function parseCatalogFreshnessAttestation(raw,{snapshot,createdAt,now=Date.now()}={}){
  if(!isSnapshot(snapshot)||typeof raw!=="string"||!raw.trim()||Buffer.byteLength(raw,"utf8")>1024||!Number.isFinite(now))
    throw Error("Malformed catalog freshness attestation");
  let parsed;
  try{parsed=JSON.parse(raw);}catch{throw Error("Malformed catalog freshness attestation");}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Malformed catalog freshness attestation");
  if(parsed.schema_version!==1||parsed.provider!=="mangabaka"||parsed.license!=="CC-BY-NC-SA-4.0"||
     parsed.source_sha256!==snapshot||!isOfficialSha1(parsed.official_sha1))
    throw Error("Mismatched catalog freshness attestation");
  if(typeof parsed.created_at!=="string"||!ISO_UTC_RE.test(parsed.created_at)||
     (createdAt!==undefined&&parsed.created_at!==createdAt))
    throw Error("Mismatched catalog freshness created_at");
  if(typeof parsed.last_verified_at!=="string"||!ISO_UTC_RE.test(parsed.last_verified_at))
    throw Error("Malformed catalog freshness timestamp");
  const createdAtMs=Date.parse(parsed.created_at);
  const verifiedAtMs=Date.parse(parsed.last_verified_at);
  if(!Number.isFinite(createdAtMs)||!Number.isFinite(verifiedAtMs)||
     !Number.isSafeInteger(parsed.verified_epoch_ms)||parsed.verified_epoch_ms!==verifiedAtMs)
    throw Error("Malformed catalog freshness epoch");
  if(createdAtMs>now||verifiedAtMs>now||verifiedAtMs<createdAtMs)
    throw Error("Future-dated or out-of-order catalog freshness attestation");
  if(now-verifiedAtMs>MAX_CATALOG_FRESHNESS_MS)
    throw Error("Expired catalog freshness attestation");
  return {
    schemaVersion:1,
    provider:"mangabaka",
    license:"CC-BY-NC-SA-4.0",
    sourceSha256:parsed.source_sha256,
    createdAt:parsed.created_at,
    createdAtMs,
    lastVerifiedAt:parsed.last_verified_at,
    verifiedAtMs,
    officialSha1:parsed.official_sha1,
  };
}
export function encodeCatalogFreshnessAttestation({sourceSha256,createdAt,lastVerifiedAt,officialSha1,now=Date.now()}){
  const verifiedEpochMs=Date.parse(String(lastVerifiedAt??""));
  const payload=JSON.stringify({
    schema_version:1,
    provider:"mangabaka",
    license:"CC-BY-NC-SA-4.0",
    source_sha256:sourceSha256,
    created_at:createdAt,
    last_verified_at:lastVerifiedAt,
    verified_epoch_ms:verifiedEpochMs,
    official_sha1:officialSha1,
  });
  const record=parseCatalogFreshnessAttestation(payload,{snapshot:sourceSha256,createdAt,now});
  const ttlMs=MAX_CATALOG_FRESHNESS_MS-(now-record.verifiedAtMs);
  if(!Number.isSafeInteger(ttlMs)||ttlMs<=0||ttlMs>MAX_CATALOG_FRESHNESS_MS)
    throw Error("Invalid catalog freshness TTL");
  return {json:payload,record,ttlMs};
}
export const SWITCH_CATALOG_LUA=`
local current=redis.call('GET',KEYS[1])
if not current then current=ARGV[3] end
if current~=ARGV[1] then return 0 end
redis.call('SET',KEYS[1],ARGV[2])
return 1
`;
export const RENEW_CATALOG_FRESHNESS_LUA=`
if ARGV[1]=='1' then
  local current=redis.call('GET',KEYS[1])
  if not current then current=ARGV[3] end
  if current~=ARGV[2] then return {0,'ACTIVE_SNAPSHOT_MISMATCH'} end
end
local existing=redis.call('GET',KEYS[2])
if existing then
  local ok,prev=pcall(cjson.decode,existing)
  if not ok or type(prev)~='table' then return {0,'CORRUPT_EXISTING_ATTESTATION'} end
  if prev.schema_version~=1 or prev.provider~='mangabaka' or prev.license~='CC-BY-NC-SA-4.0' or prev.source_sha256~=ARGV[2] or prev.created_at~=ARGV[4] or prev.official_sha1~=ARGV[5] then
    return {0,'IDENTITY_MISMATCH'}
  end
  local prev_ms=tonumber(prev.verified_epoch_ms)
  local next_ms=tonumber(ARGV[6])
  if not prev_ms or not next_ms or next_ms<=prev_ms then
    return {0,'STALE_OR_CONCURRENT_RENEWAL'}
  end
end
local ttl=tonumber(ARGV[8])
if not ttl or ttl<=0 or ttl>604800000 then return {0,'INVALID_TTL'} end
redis.call('SET',KEYS[2],ARGV[7],'PX',ttl)
return {1,'RENEWED'}
`;
