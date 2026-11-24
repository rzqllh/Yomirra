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
