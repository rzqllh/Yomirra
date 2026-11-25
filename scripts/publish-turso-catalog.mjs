// Explicit operator command. No deployment, secret storage, or database mutation.
import {catalogSlots,selectCatalogSlot,isSnapshot,CATALOG_POINTER_KEY,SWITCH_CATALOG_LUA} from "../src/server/lib/metadata/catalog-slots.mjs";
import {spawnSync} from "node:child_process";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {parseArgs} from "node:util";

export function publicationPlan(env,options){
  if(env.YOMIRRA_CATALOG_PUBLICATION_CONFIRMED!=="yes"||
     env.YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED!=="yes"||
     env.VERCEL_ENV!=="production"||env.CI==="true"||env.GITHUB_ACTIONS==="true")
    throw Error("Explicit production operator and scoped read-only confirmation required");
  const slots=catalogSlots(env);
  if(!slots?.pointer||!slots.standby)throw Error("Two verified configured slots required");
  if(!isSnapshot(options.expected)||!isSnapshot(options.target)||options.expected===options.target||
     ![slots.primary.snapshot,slots.standby.snapshot].includes(options.expected)||
     ![slots.primary.snapshot,slots.standby.snapshot].includes(options.target)||
     !Number.isSafeInteger(options.readHeadroom)||options.readHeadroom<=0||
     typeof options.stage!=="string"||!options.stage.trim())
    throw Error("Invalid publication plan");
  return {slots,target:selectCatalogSlot(slots,options.target)};
}

export async function verifyTarget(slot,options){
  const root=await mkdtemp(join(tmpdir(),"yomirra-publication-"));
  try{
    const output=join(root,"verified.json");
    const result=spawnSync("python3",[
      fileURLToPath(new URL("./verify-turso-candidate.py",import.meta.url)),
      "--stage",options.stage,"--output",output,"--read-headroom",String(options.readHeadroom)
    ],{
      timeout:120000,maxBuffer:1024*1024,encoding:"utf8",
      env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,
        YOMIRRA_MANGABAKA_METADATA:"permitted",YOMIRRA_TURSO_FREE_CONFIRMED:"yes",
        YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED:"yes",
        YOMIRRA_TURSO_CANDIDATE_URL:slot.origin,YOMIRRA_TURSO_CANDIDATE_READ_TOKEN:slot.token}
    });
    if(result.status!==0||result.error)throw Error("Fresh candidate verification failed");
    return JSON.parse(await readFile(output,"utf8"));
  }finally{await rm(root,{recursive:true,force:true});}
}

export async function publishCatalog(env,options,{redis,verify=verifyTarget}){
  const {slots,target}=publicationPlan(env,options);
  const before=selectCatalogSlot(slots,await redis.get(CATALOG_POINTER_KEY));
  if(before?.snapshot!==options.expected)throw Error("Active snapshot differs; inspect before retrying");
  const evidence=await verify(target,options);
  const checked=Date.parse(evidence?.verifiedAt??"");
  if(evidence?.status!=="REMOTE_CANDIDATE_VERIFIED"||evidence.snapshot!==target.snapshot||
     evidence.activation?.YOMIRRA_TURSO_URL!==target.origin||
     evidence.activation?.YOMIRRA_TURSO_SNAPSHOT!==target.snapshot||
     evidence.productionActivated!==false||evidence.readOnlyTokenVerifiedByOperator!==true||
     !Number.isSafeInteger(evidence.accepted)||evidence.accepted<=0||
     !Number.isSafeInteger(evidence.sampled)||evidence.sampled<1||
     !Number.isFinite(checked)||checked>Date.now()||Date.now()-checked>120000)
    throw Error("Candidate acceptance evidence mismatch");
  // CAS after fresh remote acceptance. An ambiguous Redis failure is not
  // automatically retried; read the actual active pointer before continuing.
  if(Number(await redis.eval(SWITCH_CATALOG_LUA,1,CATALOG_POINTER_KEY,
     options.expected,options.target,slots.primary.snapshot))!==1)
    throw Error("Publication conflict; no overwrite");
  return {status:"POINTER_SWITCHED",previous:options.expected,active:options.target,
    accepted:evidence.accepted,sampled:evidence.sampled,verifiedAt:evidence.verifiedAt,
    deploymentTriggered:false,maximumNormalObservationDelaySeconds:30};
}

async function main(){
  const {values}=parseArgs({options:{
    expected:{type:"string"},target:{type:"string"},stage:{type:"string"},"read-headroom":{type:"string"}
  },strict:true,allowPositionals:false});
  const options={expected:values.expected,target:values.target,stage:values.stage,readHeadroom:Number(values["read-headroom"])};
  publicationPlan(process.env,options);
  // Use existing dependency. The operator must supply the exact production
  // Redis endpoint with a TLS, key-scoped credential; do not run from CI.
  const url=new URL(process.env.REDIS_URL??"");
  if(url.protocol!=="rediss:"||!url.password||!url.hostname||url.search||url.hash)throw Error("TLS Redis credential required");
  const {default:Redis}=await import("ioredis");
  const redis=new Redis(url.toString(),{lazyConnect:true,enableOfflineQueue:false,
    maxRetriesPerRequest:0,autoResendUnfulfilledCommands:false,connectTimeout:3000,
    commandTimeout:3000,retryStrategy:()=>null});
  redis.on("error",()=>{});
  try{
    await redis.connect();
    const result=await publishCatalog(process.env,options,{redis});
    console.log(JSON.stringify(result));
  }finally{redis.disconnect();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{await main();}catch{
    console.error("Publication not confirmed. Inspect active pointer and candidate before any retry.");
    process.exitCode=1;
  }
}
