import {test,expect} from "./fixtures";
import Redis from "ioredis";
import {randomUUID} from "node:crypto";
import {APPEND_REPORT,UPDATE_REPORT} from "../src/server/lib/ops/report-redis-scripts.mjs";
import {
  encodeCatalogFreshnessAttestation,
  MAX_CATALOG_FRESHNESS_MS,
  RENEW_CATALOG_FRESHNESS_LUA,
  SWITCH_CATALOG_LUA,
} from "../src/server/lib/metadata/catalog-slots.mjs";
test("actual isolated Redis verifies report concurrency, pointer CAS, and freshness renewal CAS",async({baseURL})=>{
  const url=process.env.REDIS_URL;
  const host=url?new URL(url).hostname:"";
  test.skip(process.env.CI!=="true"||process.env.E2E_PRODUCTION_BUILD!=="1"||!baseURL||
    new URL(baseURL).hostname!=="localhost"||!["redis","localhost","127.0.0.1"].includes(host),"Requires disposable CI Redis service");
  const redis=new Redis(url!,{maxRetriesPerRequest:0,autoResendUnfulfilledCommands:false,connectTimeout:2000,commandTimeout:2000});
  const other=new Redis(url!,{maxRetriesPerRequest:0,autoResendUnfulfilledCommands:false,connectTimeout:2000,commandTimeout:2000});
  const key="yomirra:ci:reports:"+randomUUID(),pointer="yomirra:ci:pointer:"+randomUUID(),freshness="yomirra:ci:freshness:"+randomUUID();
  const row=(id:string)=>JSON.stringify({id,type:"other",category:"fixture",status:"pending",createdAt:"2026-11-25T00:00:00Z"});
  const a="a".repeat(64),b="b".repeat(64),sha1="c".repeat(40);
  try{
    await redis.eval(APPEND_REPORT,1,key,row("first"));
    await redis.expire(key,300);
    const [append,update]=await Promise.all([
      other.eval(APPEND_REPORT,1,key,row("second")),
      redis.eval(UPDATE_REPORT,1,key,"first","resolved","2026-11-25T00:00:00Z")
    ]);
    expect(Number(append)).toBe(1);
    expect(JSON.parse(String(update))).toMatchObject({id:"first",status:"resolved"});
    const rows=(await redis.lrange(key,0,199)).map(value=>JSON.parse(value));
    expect(rows.map(r=>r.id)).toEqual(["second","first"]);
    expect(rows[0].status).toBe("pending");
    expect(rows[1].status).toBe("resolved");
    expect(await redis.eval(UPDATE_REPORT,1,key,"missing","pending","")).toBeNull();
    expect(JSON.parse(String(await redis.eval(UPDATE_REPORT,1,key,"first","pending","")))).not.toHaveProperty("resolvedAt");
    expect(await redis.llen(key)).toBe(2);
    const switches=await Promise.all([redis.eval(SWITCH_CATALOG_LUA,1,pointer,a,b,a),other.eval(SWITCH_CATALOG_LUA,1,pointer,a,b,a)]);
    await redis.expire(pointer,300);
    expect(switches.map(Number).sort()).toEqual([0,1]);
    expect(await redis.get(pointer)).toBe(b);
    expect(Number(await redis.eval(SWITCH_CATALOG_LUA,1,pointer,b,a,a))).toBe(1);
    expect(await redis.get(pointer)).toBe(a);

    const now=Date.now();
    const createdAt=new Date(now-5*86400000).toISOString();
    const verifiedAt=new Date(now-1000).toISOString();
    const att=encodeCatalogFreshnessAttestation({
      sourceSha256:a,
      createdAt,
      lastVerifiedAt:verifiedAt,
      officialSha1:sha1,
      now,
    });
    const renewals=await Promise.all([
      redis.eval(RENEW_CATALOG_FRESHNESS_LUA,2,pointer,freshness,"1",a,a,createdAt,sha1,String(att.record.verifiedAtMs),att.json,String(att.ttlMs)),
      other.eval(RENEW_CATALOG_FRESHNESS_LUA,2,pointer,freshness,"1",a,a,createdAt,sha1,String(att.record.verifiedAtMs),att.json,String(att.ttlMs)),
    ]) as [number,string][];
    expect(renewals.map(r=>Number(r[0])).sort()).toEqual([0,1]);
    const pttl=await redis.pttl(freshness);
    expect(pttl).toBeGreaterThan(0);
    expect(pttl).toBeLessThanOrEqual(MAX_CATALOG_FRESHNESS_MS);

    // Mismatched active pointer refuses renewal
    const wrongPointer=await redis.eval(
      RENEW_CATALOG_FRESHNESS_LUA,2,pointer,freshness,"1",b,a,createdAt,sha1,String(now),att.json,"60000"
    ) as [number,string];
    expect(Number(wrongPointer[0])).toBe(0);
    expect(wrongPointer[1]).toBe("ACTIVE_SNAPSHOT_MISMATCH");
  }finally{
    // Unique disposable CI keys only; no DEL/FLUSH or production keys.
    await Promise.allSettled([redis.expire(key,300),redis.expire(pointer,300),redis.expire(freshness,300)]);
    redis.disconnect();other.disconnect();
  }
});
