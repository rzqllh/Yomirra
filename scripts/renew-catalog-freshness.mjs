// Explicit operator freshness renewal command (INF-08).
// Renews snapshot-bound Redis freshness attestation ONLY after validating the
// official upstream checksum against the verified local + active remote snapshot.
// Never rebuilds, reimports, rotates databases, mutates SQLite, or redeploys.
import {
  catalogSlots,
  selectCatalogSlot,
  isSnapshot,
  isOfficialSha1,
  catalogFreshnessKey,
  encodeCatalogFreshnessAttestation,
  CATALOG_POINTER_KEY,
  RENEW_CATALOG_FRESHNESS_LUA,
} from "../src/server/lib/metadata/catalog-slots.mjs";
import {createHash} from "node:crypto";
import {lstat,readFile,writeFile} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {parseArgs} from "node:util";

const DUMPS_URL="https://mangabaka.org/developers/dumps";
const DUMP_FILENAME="series.jsonl.zst";

function isOfficialMangaBakaUrl(raw){
  try{
    const u=new URL(raw);
    return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&
      (u.hostname==="mangabaka.org"||u.hostname.endsWith(".mangabaka.org"));
  }catch{return false;}
}

async function fetchOfficialText(url,maxBytes){
  let target=url;
  for(let hops=0;hops<4;hops++){
    if(!isOfficialMangaBakaUrl(target))throw Error("Unverified upstream checksum origin");
    const response=await fetch(target,{
      redirect:"manual",
      cache:"no-store",
      signal:AbortSignal.timeout(10000),
      headers:{"User-Agent":"Yomirra-Noncommercial-Catalog-Renewal/1.0",Accept:"*/*"},
    });
    if(response.status>=300&&response.status<400){
      const location=response.headers.get("location");
      await response.body?.cancel();
      if(!location)throw Error("Invalid upstream redirect");
      target=new URL(location,target).href;
      continue;
    }
    if(!response.ok||!response.body){
      await response.body?.cancel();
      throw Error("Official upstream checksum unavailable");
    }
    const reader=response.body.getReader(),decoder=new TextDecoder();
    let total=0,text="";
    try{
      for(;;){
        const {done,value}=await reader.read();
        if(done)break;
        total+=value.byteLength;
        if(total>maxBytes)throw Error("Official upstream response exceeds bound");
        text+=decoder.decode(value,{stream:true});
      }
      text+=decoder.decode();
      return text;
    }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  }
  throw Error("Too many upstream redirects");
}

export function discoverOfficialChecksumUrl(html){
  const rows=html.match(/<tr\b[\s\S]*?<\/tr>/gi)??[];
  const matches=[];
  for(const row of rows){
    const anchors=[...row.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m=>[m[1],m[2].replace(/<[^>]+>/g,"").trim()]);
    const files=anchors.filter(([,label])=>label===DUMP_FILENAME).map(([href])=>href);
    const sha1s=anchors.filter(([,label])=>label.toLowerCase()==="sha1").map(([href])=>href);
    if(files.length===1&&sha1s.length===1){
      const dataUrl=new URL(files[0],DUMPS_URL).href;
      const sha1Url=new URL(sha1s[0],DUMPS_URL).href;
      if(!isOfficialMangaBakaUrl(dataUrl)||!isOfficialMangaBakaUrl(sha1Url))
        throw Error("Unverified download origin");
      if(!decodeURIComponent(new URL(dataUrl).pathname).endsWith("/"+DUMP_FILENAME))
        throw Error("Unexpected dump filename");
      matches.push(sha1Url);
    }
  }
  if(matches.length!==1)throw Error("Official default JSONL checksum link unavailable");
  return matches[0];
}

export async function verifyOfficialUpstreamSha1(){
  const html=await fetchOfficialText(DUMPS_URL,2*1024*1024);
  const checksumUrl=discoverOfficialChecksumUrl(html);
  const raw=(await fetchOfficialText(checksumUrl,1024)).trim();
  const match=/^([a-fA-F0-9]{40})(?:[ \t]+[*]?[^\r\n]+)?$/.exec(raw);
  if(!match)throw Error("Malformed official SHA1 checksum");
  return match[1].toLowerCase();
}

export async function verifyLocalSnapshotForRenewal(snapshotDir){
  const dir=resolve(String(snapshotDir??""));
  const indexPath=resolve(dir,"catalog.sqlite");
  const reportPath=resolve(dir,"manifest.json");
  const [istat,rstat]=await Promise.all([lstat(indexPath),lstat(reportPath)]);
  if(!istat.isFile()||istat.isSymbolicLink()||!rstat.isFile()||rstat.isSymbolicLink()||rstat.size>65536)
    throw Error("Verified local snapshot files missing");
  const report=JSON.parse(await readFile(reportPath,"utf8"));
  if(report?.schemaVersion!==2||report.provider!=="mangabaka"||report.license!=="CC-BY-NC-SA-4.0"||
     !isOfficialSha1(report.officialSha1)||!isSnapshot(report.normalizedInputSha256)||
     !Number.isSafeInteger(report.accepted)||report.accepted<=0||report.indexBytes!==istat.size)
    throw Error("Local snapshot manifest invalid");
  const bytes=await readFile(indexPath);
  if(createHash("sha256").update(bytes).digest("hex")!==report.indexSha256)
    throw Error("Local snapshot hash mismatch");
  const db=new DatabaseSync(indexPath,{readOnly:true});
  try{
    const integrity=db.prepare("PRAGMA integrity_check").get();
    if(integrity?.integrity_check!=="ok"||db.prepare("PRAGMA foreign_key_check").get())
      throw Error("Local SQLite integrity check failed");
    const rows=db.prepare("SELECT schema_version, created_at, license, provider, source_sha256, accepted FROM manifest LIMIT 2").all();
    if(rows.length!==1)throw Error("Local SQLite manifest missing");
    const m=rows[0];
    if(m.schema_version!==2||m.license!=="CC-BY-NC-SA-4.0"||m.provider!=="mangabaka"||
       m.source_sha256!==report.normalizedInputSha256||m.accepted!==report.accepted||
       typeof m.created_at!=="string"||(report.createdAt&&m.created_at!==report.createdAt))
      throw Error("Local SQLite manifest mismatch");
    const count=Number(db.prepare("SELECT COUNT(*) AS n FROM works").get()?.n);
    if(count!==report.accepted)throw Error("Local SQLite record count mismatch");
    return {
      sourceSha256:m.source_sha256,
      createdAt:m.created_at,
      officialSha1:report.officialSha1,
      accepted:report.accepted,
    };
  }finally{db.close();}
}

export async function verifyRemoteActiveManifest(slot){
  const response=await fetch(slot.origin+"/v2/pipeline",{
    method:"POST",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(5000),
    headers:{Authorization:"Bearer "+slot.token,"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({requests:[
      {type:"execute",stmt:{sql:"SELECT CAST(schema_version AS TEXT), created_at, license, provider, source_sha256, CAST(accepted AS TEXT) FROM manifest LIMIT 2",args:[]}},
      {type:"execute",stmt:{sql:"SELECT CAST(COUNT(*) AS TEXT) FROM works",args:[]}},
      {type:"close"},
    ]}),
  });
  if(!response.ok||!response.body){
    await response.body?.cancel();
    throw Error("Remote active catalog verification failed");
  }
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let size=0,raw="";
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>256*1024)throw Error("Remote manifest response exceeds limit");
      raw+=decoder.decode(value,{stream:true});
    }
    raw+=decoder.decode();
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  const parsed=JSON.parse(raw);
  const results=parsed?.results;
  if(!Array.isArray(results)||results.length!==3||results[2]?.type!=="ok"||results[2]?.response?.type!=="close")
    throw Error("Remote catalog protocol mismatch");
  const mRows=results[0]?.response?.result?.rows;
  const cRows=results[1]?.response?.result?.rows;
  if(results[0]?.type!=="ok"||results[1]?.type!=="ok"||!Array.isArray(mRows)||mRows.length!==1||mRows[0]?.length!==6||
     !Array.isArray(cRows)||cRows.length!==1||cRows[0]?.length!==1)
    throw Error("Remote catalog manifest missing");
  const text=cell=>{if(cell?.type!=="text"||typeof cell.value!=="string")throw Error("Invalid remote cell");return cell.value;};
  const [schemaVersion,createdAt,license,provider,sourceSha256,accepted]=mRows[0].map(text);
  const worksCount=text(cRows[0][0]);
  if(schemaVersion!=="2"||license!=="CC-BY-NC-SA-4.0"||provider!=="mangabaka"||
     sourceSha256!==slot.snapshot||worksCount!==accepted)
    throw Error("Remote active catalog identity mismatch");
  return {createdAt,sourceSha256,accepted:Number(accepted)};
}

export function renewalPlan(env,options){
  if(env.YOMIRRA_CATALOG_FRESHNESS_RENEWAL_CONFIRMED!=="yes"||
     env.YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED!=="yes"||
     env.VERCEL_ENV!=="production"||env.CI==="true"||env.GITHUB_ACTIONS==="true")
    throw Error("Explicit production operator and scoped read-only confirmation required");
  const slots=catalogSlots(env);
  if(!slots)throw Error("Configured Turso catalog slot required");
  if(!isSnapshot(options?.expected)||typeof options?.snapshotDir!=="string"||!options.snapshotDir.trim())
    throw Error("Invalid freshness renewal plan");
  const allowed=slots.pointer?[slots.primary.snapshot,slots.standby.snapshot]:[slots.primary.snapshot];
  if(!allowed.includes(options.expected))throw Error("Target snapshot is not configured");
  return slots;
}

export async function renewCatalogFreshness(
  env,
  options,
  {
    redis,
    verifyLocal=verifyLocalSnapshotForRenewal,
    verifyUpstream=verifyOfficialUpstreamSha1,
    verifyRemote=verifyRemoteActiveManifest,
    now=()=>Date.now(),
  }
){
  const slots=renewalPlan(env,options);
  const active=slots.pointer
    ? selectCatalogSlot(slots,await redis.get(CATALOG_POINTER_KEY))
    : slots.primary;
  if(!active||active.snapshot!==options.expected)
    throw Error("Active snapshot differs; inspect before renewing");
  const [local,upstreamSha1,remote]=await Promise.all([
    verifyLocal(options.snapshotDir),
    verifyUpstream(),
    verifyRemote(active),
  ]);
  if(local.sourceSha256!==options.expected)throw Error("Local snapshot does not match active snapshot");
  if(upstreamSha1!==local.officialSha1)
    throw Error("Official upstream checksum changed; stage a new candidate instead of renewing");
  if(remote.sourceSha256!==local.sourceSha256||remote.createdAt!==local.createdAt||remote.accepted!==local.accepted)
    throw Error("Remote active manifest disagrees with verified local snapshot");
  const currentMs=now();
  const verifiedIso=new Date(currentMs).toISOString();
  const {json,record,ttlMs}=encodeCatalogFreshnessAttestation({
    sourceSha256:local.sourceSha256,
    createdAt:local.createdAt,
    lastVerifiedAt:verifiedIso,
    officialSha1:upstreamSha1,
    now:currentMs,
  });
  const outcome=await redis.eval(
    RENEW_CATALOG_FRESHNESS_LUA,
    2,
    CATALOG_POINTER_KEY,
    catalogFreshnessKey(local.sourceSha256),
    slots.pointer?"1":"0",
    local.sourceSha256,
    slots.primary.snapshot,
    local.createdAt,
    upstreamSha1,
    String(record.verifiedAtMs),
    json,
    String(ttlMs),
  );
  const statusCode=Array.isArray(outcome)?Number(outcome[0]):Number(outcome);
  const reason=Array.isArray(outcome)?String(outcome[1]??""):"";
  if(statusCode!==1)throw Error("Freshness renewal rejected: "+(reason||"CONFLICT"));
  if(options.localAttestationOutput){
    await writeFile(resolve(options.localAttestationOutput),json+"\n",{encoding:"utf8",flag:"wx"});
  }
  return {
    status:"FRESHNESS_RENEWED",
    snapshot:local.sourceSha256,
    createdAt:local.createdAt,
    lastVerifiedAt:record.lastVerifiedAt,
    officialSha1:upstreamSha1,
    accepted:local.accepted,
    ttlMs,
    rebuilt:false,
    reimported:false,
    databaseRotated:false,
    deploymentTriggered:false,
  };
}

async function main(){
  const {values}=parseArgs({
    options:{
      expected:{type:"string"},
      "snapshot-dir":{type:"string"},
      "write-local-attestation":{type:"string"},
    },
    strict:true,
    allowPositionals:false,
  });
  const options={
    expected:values.expected,
    snapshotDir:values["snapshot-dir"],
    localAttestationOutput:values["write-local-attestation"],
  };
  renewalPlan(process.env,options);
  const url=new URL(process.env.REDIS_URL??"");
  if(url.protocol!=="rediss:"||!url.password||!url.hostname||url.search||url.hash)
    throw Error("TLS Redis credential required");
  const {default:Redis}=await import("ioredis");
  const redis=new Redis(url.toString(),{
    lazyConnect:true,enableOfflineQueue:false,maxRetriesPerRequest:0,
    autoResendUnfulfilledCommands:false,connectTimeout:3000,commandTimeout:3000,
    retryStrategy:()=>null,
  });
  redis.on("error",()=>{});
  try{
    await redis.connect();
    const result=await renewCatalogFreshness(process.env,options,{redis});
    console.log(JSON.stringify(result));
  }finally{redis.disconnect();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{await main();}catch{
    console.error("Freshness renewal not confirmed. Verify active snapshot and upstream checksum before retrying.");
    process.exitCode=1;
  }
}
