// Build a private, permitted-use index from an already downloaded official
// MangaBaka JSONL dump. No network, no raw third-party fields, no overwrites.
import {createReadStream} from "node:fs";
import {stat,copyFile,link,unlink,open} from "node:fs/promises";
import {createInterface} from "node:readline";
import {DatabaseSync} from "node:sqlite";
import {createHash,randomUUID} from "node:crypto";
import {pathToFileURL} from "node:url";
import {parseCatalogRecord} from "../src/server/lib/metadata/mangabaka-record.mjs";
import {encodeCatalogPayload} from "../src/server/lib/metadata/catalog-payload.mjs";
import {normalizeTitle} from "../src/shared/lib/normalize-title.mjs";

export async function buildCatalogIndex(input,output,{previous,permitted=false,minimum=1}={}){
  if(!permitted)throw Error("Confirm permitted MangaBaka use and attribution before importing");
  if(!input||!output||input===output||previous===output)throw Error("Use a new output path");
  const inputStat=await stat(input);
  if(!inputStat.isFile()||inputStat.size>6*1024*1024*1024)throw Error("Invalid dump size");
  const temp=output+"."+randomUUID()+".partial";
  let db,created=false,read=0,accepted=0,changed=0,unchanged=0,skipped=0;
  const snapshot=new Date().toISOString();
  const generation="1";
  const counts={manga:0,manhwa:0,manhua:0,safe:0,suggestive:0,erotica:0,pornographic:0,withExternalIds:0};
  const hash=createHash("sha256");
  try{
    if(previous){await copyFile(previous,temp,1);created=true;}
    else{const file=await open(temp,"wx");created=true;await file.close();}
    db=new DatabaseSync(temp);
    db.exec("PRAGMA journal_mode=DELETE; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS works(id INTEGER PRIMARY KEY,payload BLOB NOT NULL,seen TEXT NOT NULL); CREATE TABLE IF NOT EXISTS lookup(key TEXT NOT NULL,work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,PRIMARY KEY(key,work_id)) WITHOUT ROWID; CREATE INDEX IF NOT EXISTS lookup_work ON lookup(work_id); CREATE TABLE IF NOT EXISTS manifest(schema_version INTEGER,created_at TEXT,license TEXT,provider TEXT,source_sha256 TEXT,accepted INTEGER);");
    if(previous){
      const prior=db.prepare("SELECT schema_version,provider,license FROM manifest LIMIT 1").get();
      if((prior?.schema_version!==1&&prior?.schema_version!==2)||prior.provider!=="mangabaka"||prior.license!=="CC-BY-NC-SA-4.0")throw Error("Invalid previous index");
    }
    const get=db.prepare("SELECT payload,seen FROM works WHERE id=?");
    const put=db.prepare("INSERT INTO works(id,payload,seen) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,seen=excluded.seen");
    const mark=db.prepare("UPDATE works SET seen=? WHERE id=?");
    const clear=db.prepare("DELETE FROM lookup WHERE work_id=?");
    const add=db.prepare("INSERT OR IGNORE INTO lookup(key,work_id) VALUES(?,?)");
    const stream=createReadStream(input,{encoding:"utf8"});
    const lines=createInterface({input:stream,crlfDelay:Infinity});
    db.exec("BEGIN");
    if(previous)db.exec("UPDATE works SET seen='0'");
    for await(const line of lines){
      if(!line.trim())continue;
      if(line.length>4*1024*1024)throw Error("Dump row exceeds limit");
      hash.update(line+"\n");
      read++;
      const row=JSON.parse(line);
      const work=parseCatalogRecord(row,true);
      if(!work){skipped++;continue;}
      const payload=encodeCatalogPayload(work);
      const old=get.get(work.externalId);
      if(old?.seen===generation)throw Error("Duplicate active work identity");
      accepted++;
      counts[work.format]++;counts[work.contentRating]++;if(work.externalWorkIds)counts.withExternalIds++;
      if(old?.payload instanceof Uint8Array&&Buffer.from(old.payload).equals(payload)){mark.run(generation,work.externalId);unchanged++;}
      else{
        put.run(work.externalId,payload,generation);
        clear.run(work.externalId);
        for(const title of new Set([work.title,...work.aliases].map(normalizeTitle).filter(Boolean)))add.run("title:"+title,work.externalId);
        for(const [namespace,id] of Object.entries(work.externalWorkIds??{}))add.run("id:"+namespace+":"+id,work.externalId);
        changed++;
      }
    }
    if(accepted<minimum||accepted===0||accepted/read<0.1)throw Error("Insufficient valid records; refusing to publish");
    // Only the new candidate snapshot is reconciled. Previous snapshot,
    // user libraries and source references are never changed.
    db.prepare("DELETE FROM works WHERE seen<>?").run(generation);
    db.exec("DELETE FROM manifest");
    const digest=hash.digest("hex");
    db.prepare("INSERT INTO manifest VALUES(2,?,?,?,?,?)").run(snapshot,"CC-BY-NC-SA-4.0","mangabaka",digest,accepted);
    db.exec("COMMIT");
    // Compact deleted/updated pages only inside the disposable candidate.
    db.exec("VACUUM");
    const integrity=db.prepare("PRAGMA integrity_check").get();
    if(integrity?.integrity_check!=="ok")throw Error("Integrity check failed");
    db.close();db=undefined;
    await link(temp,output); // Atomic publication; fails if output already exists.
    return {provider:"mangabaka",license:"CC-BY-NC-SA-4.0",read,accepted,changed,unchanged,skipped,createdAt:snapshot,normalizedInputSha256:digest,counts,schemaVersion:2};
  }finally{
    if(db)db.close();
    if(created)await unlink(temp).catch(()=>{});
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [input,output,previous]=process.argv.slice(2);
  const result=await buildCatalogIndex(input,output,{previous,permitted:process.env.YOMIRRA_MANGABAKA_METADATA==="permitted",minimum:300});
  console.log(JSON.stringify(result,null,2));
}
