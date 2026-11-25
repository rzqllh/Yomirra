// @vitest-environment node
import {afterEach,describe,expect,it,vi} from "vitest";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {measureCanonicalMatcher,type BenchmarkRow,type ReviewedDecision} from "../canonical-benchmark";
import {findLocalMetadataWorks} from "../local-catalog-index";
import {normalizeExternalWorkIds} from "@/shared/lib/external-work-ids";
import {comicFormat,type MetadataWork} from "@/shared/lib/metadata-catalog";

const item={id:"fixture",title:"Fixture",coverUrl:"",format:"manga",author:"Author",contentRating:"safe" as const};
const work:MetadataWork={provider:"mangabaka",externalId:1,title:"Fixture",aliases:[],format:"manga",contentRating:"safe",authors:["Author"]};
afterEach(()=>vi.unstubAllEnvs());
describe("runtime canonical benchmark accounting",()=>{
  it("measures actual matcher results rather than candidate recall or unsupported success",()=>{
    const rows:BenchmarkRow[]=[
      {item:{...item,id:"correct"},label:{decision:"match",canonicalId:1}},
      {item:{...item,id:"wrong"},label:{decision:"match",canonicalId:2}},
      {item:{...item,id:"false"},label:{decision:"ambiguous"}},
      {item:{...item,id:"miss"},label:{decision:"match",canonicalId:1}},
      {item:{...item,id:"abstain"},label:{decision:"no-match"}},
      {item:{...item,id:"unavailable"},label:{decision:"no-match"}},
      {item:{...item,id:"unresolved"},label:{decision:"unresolved"}}
    ];
    const result=measureCanonicalMatcher(rows,row=>row.id==="unavailable"?null:
      ["miss","abstain"].includes(row.id)?[]:[work]);
    expect(result).toMatchObject({total:7,reviewed:6,expectedMatches:3,predictedMatches:3,correctMatches:1,
      wrongIdentity:1,falseMatch:1,correctAbstentions:1,missedMatches:1,unavailable:1,
      ambiguousMatched:1,precision:1/3,recall:1/3,coverage:5/7,benchmarkPass:false,independentlyVerified:false});
  });
});

function readJson(path:string){
  if(!statSync(path).isFile()||statSync(path).size>16*1024*1024)throw Error("Review input exceeds bound");
  const bytes=readFileSync(path);
  return {data:JSON.parse(bytes.toString("utf8")),sha:createHash("sha256").update(bytes).digest("hex")};
}
function textArray(value:unknown):string[]{
  return Array.isArray(value)?value.filter((x):x is string=>typeof x==="string"&&x.length<=300).slice(0,100):[];
}
const enabled=process.env.YOMIRRA_RUN_CANONICAL_BENCHMARK==="yes";
it.skipIf(!enabled)("measures 300 supplied independent labels against the actual local runtime matcher",async()=>{
  if(process.env.CI==="true"||process.env.GITHUB_ACTIONS==="true"||process.env.YOMIRRA_MANGABAKA_METADATA!=="permitted")
    throw Error("Private operator-side permitted-use benchmark only");
  const index=resolve(process.env.YOMIRRA_BENCHMARK_INDEX??"");
  const packet=resolve(process.env.YOMIRRA_BENCHMARK_PACKET??"");
  const labels=resolve(process.env.YOMIRRA_BENCHMARK_LABELS??"");
  const observation=resolve(process.env.YOMIRRA_BENCHMARK_OBSERVATIONS??"");
  const {validateReview}=await import("../../../../../scripts/canonical-review.mjs");
  const validated=await validateReview(packet,labels);
  if(!validated.reviewComplete)throw Error("300 resolved reviewer labels required");
  const p=readJson(packet),l=readJson(labels),o=readJson(observation);
  if(p.data.observationSha256!==o.sha||l.data.packetSha256!==p.sha||o.data.rows?.length!==300||
     o.data.kind!=="single-provider-observation"||o.data.source!=="MangaDex"||o.data.status!=="OBSERVATIONS_COLLECTED")
    throw Error("Observation/review digest mismatch");
  const builtin=(process as NodeJS.Process & {getBuiltinModule?:(id:string)=>unknown}).getBuiltinModule?.("node:sqlite") as
    {DatabaseSync:new(path:string,opts:{readOnly:boolean})=>{prepare:(q:string)=>{all:()=>unknown[]},close:()=>void}}|undefined;
  if(!builtin||!statSync(index).isFile())throw Error("Node SQLite unavailable");
  const db=new builtin.DatabaseSync(index,{readOnly:true});
  try{
    const manifest=db.prepare("SELECT schema_version,source_sha256,provider,license FROM manifest LIMIT 2").all() as Array<{schema_version:number;source_sha256:string;provider:string;license:string}>;
    if(manifest.length!==1||manifest[0].schema_version!==2||manifest[0].source_sha256!==p.data.catalogSnapshot||
       manifest[0].provider!=="mangabaka"||manifest[0].license!=="CC-BY-NC-SA-4.0")throw Error("Catalog snapshot mismatch");
  }finally{db.close();}
  const byId=new Map<string,ReviewedDecision>(l.data.rows.map((row:{sourceId:string}&ReviewedDecision)=>[row.sourceId,row]));
  const packetIds=new Set<string>(p.data.rows.map((row:{sourceId:string})=>row.sourceId));
  const rows:BenchmarkRow[]=o.data.rows.map((row:{id:string;sourceId:string;title:string;formatHint:string;contentRating:string;aliases?:unknown;authors?:unknown;externalWorkIds?:unknown})=>{
    const label=byId.get(row.id),format=comicFormat(row.formatHint);
    if(!packetIds.has(row.id)||!label||row.sourceId!=="mangadex"||row.contentRating!=="safe"||!format||
       typeof row.title!=="string"||!row.title.trim())throw Error("Invalid observed work");
    return {item:{id:row.id,title:row.title,coverUrl:"",format,contentRating:"safe",
      alternativeTitles:textArray(row.aliases),author:textArray(row.authors)[0],
      externalWorkIds:normalizeExternalWorkIds(row.externalWorkIds)},label};
  });
  if(new Set(rows.map(row=>row.item.id)).size!==300)throw Error("Duplicate observed work");
  vi.stubEnv("YOMIRRA_MANGABAKA_INDEX_PATH",index);
  const result=measureCanonicalMatcher(rows,row=>findLocalMetadataWorks({
    titles:[row.title,row.originalTitle??"",...(row.alternativeTitles??[])],
    externalWorkIds:row.externalWorkIds
  }));
  // This evaluates the same function and local indexed retrieval used by the
  // application, using normalized observation records, not full provider HTML.
  console.log(JSON.stringify({kind:"runtime-canonical-matcher-evidence",catalogSnapshot:p.data.catalogSnapshot,
    observationSha256:o.sha,packetSha256:p.sha,...result}));
  expect(result.reviewed).toBe(300);
  expect(result.unavailable).toBe(0);
  // No invented threshold, no automatic gate pass. Independent reviewer
  // validity and the owner's acceptance criteria remain separate.
},120000);
