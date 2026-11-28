import test from "node:test";
import assert from "node:assert/strict";
import {publishCatalog} from "../publish-turso-catalog.mjs";
import {CATALOG_POINTER_KEY,SWITCH_CATALOG_LUA} from "../../src/server/lib/metadata/catalog-slots.mjs";
const a="a".repeat(64),b="b".repeat(64);
const env={YOMIRRA_CATALOG_PUBLICATION_CONFIRMED:"yes",YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED:"yes",VERCEL_ENV:"production",YOMIRRA_MANGABAKA_METADATA:"permitted",YOMIRRA_TURSO_FREE_CONFIRMED:"yes",YOMIRRA_TURSO_POINTER_ENABLED:"yes",YOMIRRA_TURSO_URL:"https://a-test.turso.io",YOMIRRA_TURSO_READ_TOKEN:"a-secret",YOMIRRA_TURSO_SNAPSHOT:a,YOMIRRA_TURSO_STANDBY_URL:"https://b-test.turso.io",YOMIRRA_TURSO_STANDBY_READ_TOKEN:"b-secret",YOMIRRA_TURSO_STANDBY_SNAPSHOT:b};
const options={expected:a,target:b,stage:"fixture",readHeadroom:10000};
const evidence=slot=>({status:"REMOTE_CANDIDATE_VERIFIED",snapshot:slot.snapshot,activation:{YOMIRRA_TURSO_URL:slot.origin,YOMIRRA_TURSO_SNAPSHOT:slot.snapshot},productionActivated:false,readOnlyTokenVerifiedByOperator:true,accepted:100,sampled:3,verifiedAt:new Date().toISOString()});
test("publishes and rolls back only configured verified slots",async()=>{
  let active=null,verifications=0;
  const redis={get:async key=>{assert.equal(key,CATALOG_POINTER_KEY);return active;},eval:async(sql,count,key,expected,target,primary)=>{
    assert.equal(sql,SWITCH_CATALOG_LUA);assert.equal(count,1);assert.equal(key,CATALOG_POINTER_KEY);
    if((active??primary)!==expected)return 0;active=target;return 1;
  }};
  const verify=async slot=>{verifications++;return evidence(slot)};
  const published=await publishCatalog(env,options,{redis,verify});
  assert.equal(active,b);assert.equal(published.status,"POINTER_SWITCHED");assert.equal(published.deploymentTriggered,false);
  assert.ok(!JSON.stringify(published).includes("secret"));
  await publishCatalog(env,{...options,expected:b,target:a},{redis,verify});
  assert.equal(active,a);assert.equal(verifications,2);
});
test("never writes on unapproved environment, wrong current pointer, or failed verification",async()=>{
  let writes=0;
  const redis={get:async()=>a,eval:async()=>{writes++;return 1}};
  const verify=async slot=>evidence(slot);
  for(const bad of [{...env,CI:"true"},{...env,YOMIRRA_CATALOG_PUBLICATION_CONFIRMED:""},{...env,YOMIRRA_TURSO_STANDBY_READ_TOKEN:""}])
    await assert.rejects(publishCatalog(bad,options,{redis,verify}));
  await assert.rejects(publishCatalog(env,{...options,expected:b,target:a},{redis,verify}));
  await assert.rejects(publishCatalog(env,options,{redis,verify:async()=>{throw Error("remote failed")}}));
  await assert.rejects(publishCatalog(env,options,{redis,verify:async slot=>({...evidence(slot),snapshot:a})}));
  assert.equal(writes,0);
});
test("CAS refuses concurrent switch without retry",async()=>{
  let calls=0;
  const redis={get:async()=>a,eval:async()=>{calls++;return 0}};
  await assert.rejects(publishCatalog(env,options,{redis,verify:async slot=>evidence(slot)}),/conflict/);
  assert.equal(calls,1);
});
