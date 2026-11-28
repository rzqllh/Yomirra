import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {buildCatalogIndex} from "../build-mangabaka-index.mjs";
import {
  discoverOfficialChecksumUrl,
  renewCatalogFreshness,
  verifyLocalSnapshotForRenewal,
} from "../renew-catalog-freshness.mjs";
import {
  CATALOG_POINTER_KEY,
  catalogFreshnessKey,
  parseCatalogFreshnessAttestation,
  RENEW_CATALOG_FRESHNESS_LUA,
} from "../../src/server/lib/metadata/catalog-slots.mjs";

const sha1="a".repeat(40);
const otherSha1="f".repeat(40);
const primary="1".repeat(64);
const standby="2".repeat(64);

const baseEnv={
  VERCEL_ENV:"production",
  YOMIRRA_MANGABAKA_METADATA:"permitted",
  YOMIRRA_TURSO_FREE_CONFIRMED:"yes",
  YOMIRRA_CATALOG_FRESHNESS_RENEWAL_CONFIRMED:"yes",
  YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED:"yes",
  YOMIRRA_TURSO_URL:"https://primary-fixture.turso.io",
  YOMIRRA_TURSO_READ_TOKEN:"primary-secret",
  YOMIRRA_TURSO_SNAPSHOT:primary,
};

function createFakeRedis(initialPointer=null){
  const store=new Map();
  if(initialPointer!==null)store.set(CATALOG_POINTER_KEY,initialPointer);
  return {
    store,
    get:async key=>store.get(key)??null,
    eval:async(sql,count,pointerKey,freshnessKey,pointerEnabled,expected,primarySnap,createdAt,officialSha1,epochMs,payload,ttlMs)=>{
      assert.equal(sql,RENEW_CATALOG_FRESHNESS_LUA);
      assert.equal(count,2);
      assert.equal(pointerKey,CATALOG_POINTER_KEY);
      assert.equal(freshnessKey,catalogFreshnessKey(expected));
      if(pointerEnabled==="1"){
        const cur=store.get(pointerKey)??primarySnap;
        if(cur!==expected)return [0,"ACTIVE_SNAPSHOT_MISMATCH"];
      }
      const existing=store.get(freshnessKey);
      if(existing){
        let prev;
        try{prev=JSON.parse(existing);}catch{return [0,"CORRUPT_EXISTING_ATTESTATION"];}
        if(prev.schema_version!==1||prev.provider!=="mangabaka"||prev.license!=="CC-BY-NC-SA-4.0"||
           prev.source_sha256!==expected||prev.created_at!==createdAt||prev.official_sha1!==officialSha1){
          return [0,"IDENTITY_MISMATCH"];
        }
        if(!(Number(epochMs)>Number(prev.verified_epoch_ms))){
          return [0,"STALE_OR_CONCURRENT_RENEWAL"];
        }
      }
      const ttl=Number(ttlMs);
      if(!(ttl>0&&ttl<=604800000))return [0,"INVALID_TTL"];
      store.set(freshnessKey,payload);
      return [1,"RENEWED"];
    },
  };
}

test("verifies real SQLite snapshot and renews single-slot and A/B pointer attestations without rebuild or redeploy",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"yomirra-renew-"));
  try{
    const input=join(dir,"series.jsonl");
    const snapDir=join(dir,"snapshot");
    const sqlitePath=join(dir,"catalog.sqlite");
    await writeFile(input,JSON.stringify({id:1995,state:"active",type:"manga",content_rating:"safe",title:"Frieren",authors:["Kanehito Yamada"]})+"\n");
    const built=await buildCatalogIndex(input,sqlitePath,{permitted:true});
    const bytes=await readFile(sqlitePath);
    const snapSha=built.normalizedInputSha256;
    await rm(snapDir,{recursive:true,force:true});
    const {mkdir,copyFile}=await import("node:fs/promises");
    await mkdir(snapDir);
    await copyFile(sqlitePath,join(snapDir,"catalog.sqlite"));
    await writeFile(join(snapDir,"manifest.json"),JSON.stringify({
      ...built,
      officialSha1:sha1,
      indexBytes:bytes.byteLength,
      indexSha256:createHash("sha256").update(bytes).digest("hex"),
    },null,2));

    const localVerified=await verifyLocalSnapshotForRenewal(snapDir);
    assert.equal(localVerified.sourceSha256,snapSha);
    assert.equal(localVerified.officialSha1,sha1);

    const redis=createFakeRedis();
    const env={...baseEnv,YOMIRRA_TURSO_SNAPSHOT:snapSha};
    const localAttestationPath=join(snapDir,"catalog.sqlite.freshness.json");
    const t1=Date.parse(built.createdAt)+5*86400000;
    const renewed=await renewCatalogFreshness(
      env,
      {expected:snapSha,snapshotDir:snapDir,localAttestationOutput:localAttestationPath},
      {
        redis,
        verifyUpstream:async()=>sha1,
        verifyRemote:async()=>({createdAt:built.createdAt,sourceSha256:snapSha,accepted:1}),
        now:()=>t1,
      }
    );
    assert.equal(renewed.status,"FRESHNESS_RENEWED");
    assert.equal(renewed.rebuilt,false);
    assert.equal(renewed.reimported,false);
    assert.equal(renewed.databaseRotated,false);
    assert.equal(renewed.deploymentTriggered,false);
    assert.ok(!JSON.stringify(renewed).includes("secret"));

    const storedRaw=redis.store.get(catalogFreshnessKey(snapSha));
    const parsed=parseCatalogFreshnessAttestation(storedRaw,{snapshot:snapSha,createdAt:built.createdAt,now:t1+1000});
    assert.equal(parsed.officialSha1,sha1);
    assert.equal(parsed.verifiedAtMs,t1);

    // Local attestation file matches exact same contract
    const fileAttested=parseCatalogFreshnessAttestation(await readFile(localAttestationPath,"utf8"),{
      snapshot:snapSha,
      createdAt:built.createdAt,
      now:t1+1000,
    });
    assert.equal(fileAttested.verifiedAtMs,t1);

    // Concurrent or stale timestamp is rejected
    await assert.rejects(
      renewCatalogFreshness(
        env,
        {expected:snapSha,snapshotDir:snapDir},
        {
          redis,
          verifyUpstream:async()=>sha1,
          verifyRemote:async()=>({createdAt:built.createdAt,sourceSha256:snapSha,accepted:1}),
          now:()=>t1,
        }
      ),
      /STALE_OR_CONCURRENT_RENEWAL/
    );

    // Later monotonic timestamp succeeds
    const renewedAgain=await renewCatalogFreshness(
      env,
      {expected:snapSha,snapshotDir:snapDir},
      {
        redis,
        verifyUpstream:async()=>sha1,
        verifyRemote:async()=>({createdAt:built.createdAt,sourceSha256:snapSha,accepted:1}),
        now:()=>t1+60000,
      }
    );
    assert.equal(renewedAgain.lastVerifiedAt,new Date(t1+60000).toISOString());
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("refuses renewal on upstream checksum change, pointer mismatch, CI, or remote disagreement",async()=>{
  const created="2026-11-20T00:00:00.000Z";
  const local=async()=>({sourceSha256:standby,createdAt:created,officialSha1:sha1,accepted:10});
  const remote=async()=>({sourceSha256:standby,createdAt:created,accepted:10});
  const abEnv={
    ...baseEnv,
    YOMIRRA_TURSO_POINTER_ENABLED:"yes",
    YOMIRRA_TURSO_STANDBY_URL:"https://standby-fixture.turso.io",
    YOMIRRA_TURSO_STANDBY_READ_TOKEN:"standby-secret",
    YOMIRRA_TURSO_STANDBY_SNAPSHOT:standby,
  };
  const redis=createFakeRedis(primary);

  // Active pointer is primary, cannot renew standby
  await assert.rejects(
    renewCatalogFreshness(abEnv,{expected:standby,snapshotDir:"fixture"},{
      redis,verifyLocal:local,verifyUpstream:async()=>sha1,verifyRemote:remote,
    }),
    /Active snapshot differs/
  );

  // Switch active pointer to standby, then test upstream checksum change refusal
  redis.store.set(CATALOG_POINTER_KEY,standby);
  await assert.rejects(
    renewCatalogFreshness(abEnv,{expected:standby,snapshotDir:"fixture"},{
      redis,verifyLocal:local,verifyUpstream:async()=>otherSha1,verifyRemote:remote,
    }),
    /upstream checksum changed/
  );

  // Remote manifest disagreement refused
  await assert.rejects(
    renewCatalogFreshness(abEnv,{expected:standby,snapshotDir:"fixture"},{
      redis,verifyLocal:local,verifyUpstream:async()=>sha1,
      verifyRemote:async()=>({sourceSha256:standby,createdAt:created,accepted:9}),
    }),
    /Remote active manifest disagrees/
  );

  // CI environment refused
  await assert.rejects(
    renewCatalogFreshness({...abEnv,CI:"true"},{expected:standby,snapshotDir:"fixture"},{
      redis,verifyLocal:local,verifyUpstream:async()=>sha1,verifyRemote:remote,
    }),
    /confirmation required/
  );
  assert.equal(redis.store.has(catalogFreshnessKey(standby)),false);
});

test("discovers official default JSONL checksum URL and rejects untrusted redirects",()=>{
  const html='<table><tr><td><a href="/dumps/series.jsonl.zst">series.jsonl.zst</a></td><td><a href="https://mangabaka.org/dumps/series.jsonl.zst.sha1">SHA1</a></td></tr></table>';
  assert.equal(discoverOfficialChecksumUrl(html),"https://mangabaka.org/dumps/series.jsonl.zst.sha1");
  const untrusted='<table><tr><td><a href="https://evil.example/series.jsonl.zst">series.jsonl.zst</a></td><td><a href="https://evil.example/sha1">SHA1</a></td></tr></table>';
  assert.throws(()=>discoverOfficialChecksumUrl(untrusted),/Unverified/);
});
