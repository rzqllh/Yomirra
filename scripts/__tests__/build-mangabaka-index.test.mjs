import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {buildCatalogIndex} from "../build-mangabaka-index.mjs";
import {decodeCatalogPayload} from "../../src/server/lib/metadata/catalog-payload.mjs";
const work=(id,title,rating="safe")=>({id,state:"active",type:"manhwa",content_rating:rating,title,native_title:"원제 "+id,authors:["Author"],source:{private_raw:"never import"}});
test("builds a compact v1/v2-compatible index and increments only a new snapshot",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"yomirra-index-"));
  try{
    const input=join(dir,"input.jsonl"),first=join(dir,"first.sqlite"),second=join(dir,"second.sqlite");
    await writeFile(input,[work(1,"First"),work(2,"Second","suggestive")].map(JSON.stringify).join("\n"));
    await assert.rejects(buildCatalogIndex(input,first),/permitted/);
    const result=await buildCatalogIndex(input,first,{permitted:true});
    assert.equal(result.accepted,2);
    const original=await readFile(first);
    const db=new DatabaseSync(first,{readOnly:true});
    assert.equal(db.prepare("SELECT work_id FROM lookup WHERE key=?").get("title:원제 1").work_id,1);
    const payload=db.prepare("SELECT payload FROM works WHERE id=1").get().payload;
    assert.ok(payload instanceof Uint8Array);
    assert.equal(decodeCatalogPayload(payload).title,"First");
    assert.ok(!JSON.stringify(decodeCatalogPayload(payload)).includes("private_raw"));
    assert.equal(db.prepare("SELECT schema_version FROM manifest").get().schema_version,2);
    db.close();
    await writeFile(input,[work(1,"First"),work(3,"Third")].map(JSON.stringify).join("\n"));
    const refreshed=await buildCatalogIndex(input,second,{previous:first,permitted:true});
    assert.equal(refreshed.unchanged,1);assert.equal(refreshed.changed,1);
    assert.equal(refreshed.added,1);assert.equal(refreshed.updated,0);assert.equal(refreshed.removed,1);
    assert.deepEqual(await readFile(first),original);
    const next=new DatabaseSync(second,{readOnly:true});
    assert.deepEqual(next.prepare("SELECT id FROM works ORDER BY id").all().map(row=>row.id),[1,3]);
    next.close();
    await assert.rejects(buildCatalogIndex(input,second,{permitted:true}));
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("rejects corrupt compressed rows and preserves legacy payload compatibility",()=>{
  assert.throws(()=>decodeCatalogPayload(new Uint8Array([1,2,3])));
  const legacy={provider:"mangabaka",externalId:7,title:"Example",aliases:["Example"],format:"manga",contentRating:"safe"};
  assert.deepEqual(decodeCatalogPayload(JSON.stringify(legacy)),legacy);
});

test("rejects a truncated refresh and retains the exact previous snapshot",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"yomirra-index-shrink-"));
  try{
    const input=join(dir,"input.jsonl"),first=join(dir,"first.sqlite"),second=join(dir,"second.sqlite");
    await writeFile(input,Array.from({length:100},(_,i)=>work(i+1,"Title "+i)).map(JSON.stringify).join("\n"));
    await buildCatalogIndex(input,first,{permitted:true});
    const before=await readFile(first);
    await writeFile(input,Array.from({length:80},(_,i)=>work(i+1,"Title "+i)).map(JSON.stringify).join("\n"));
    await assert.rejects(buildCatalogIndex(input,second,{previous:first,permitted:true}),/Unexpected catalog shrink/);
    await assert.rejects(readFile(second),{code:"ENOENT"});
    assert.deepEqual(await readFile(first),before);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("preserves valid JSONL rows containing unescaped U+2028 and U+2029 separators",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"yomirra-index-sep-"));
  try{
    const input=join(dir,"input.jsonl"),out=join(dir,"out.sqlite");
    const description="Line one\u2028\u2028Line two\u2029Line three";
    const row={...work(10651,"Separator Series"),description};
    await writeFile(input,JSON.stringify(row)+"\n","utf8");
    const result=await buildCatalogIndex(input,out,{permitted:true});
    assert.equal(result.accepted,1);
    const db=new DatabaseSync(out,{readOnly:true});
    const payload=db.prepare("SELECT payload FROM works WHERE id=10651").get().payload;
    db.close();
    assert.equal(decodeCatalogPayload(payload).description,description);
  }finally{await rm(dir,{recursive:true,force:true});}
});
