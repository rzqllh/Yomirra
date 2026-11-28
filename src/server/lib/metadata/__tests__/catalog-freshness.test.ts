// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";

const redisState=vi.hoisted(()=>({
  configured:true,
  allowed:true,
  get:vi.fn(),
}));

vi.mock("@/server/lib/cache/redis",()=>({
  get isRedisConfigured(){return redisState.configured;},
  isRedisCommandAllowed:()=>redisState.allowed,
  redis:{get:redisState.get},
}));

import {resolveCatalogVerifiedAt,resetCatalogFreshnessForTests} from "../catalog-freshness";
import {
  catalogFreshnessKey,
  encodeCatalogFreshnessAttestation,
  MAX_CATALOG_FRESHNESS_MS,
} from "../catalog-slots.mjs";

const snapshot="c".repeat(64);
const sha1="d".repeat(40);

describe("INF-08 snapshot freshness attestation",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    resetCatalogFreshnessForTests();
    redisState.configured=true;
    redisState.allowed=true;
  });

  afterEach(()=>{
    vi.useRealTimers();
    resetCatalogFreshnessForTests();
  });

  it("renews an unchanged >7-day snapshot using valid snapshot-bound Redis attestation while preserving created_at",async()=>{
    vi.useFakeTimers();
    const created="2026-11-10T00:00:00.000Z";
    const verified="2026-11-24T12:00:00.000Z";
    const now=Date.parse("2026-11-26T00:00:00.000Z"); // 16 days after created_at, 1.5 days after verified
    vi.setSystemTime(now);
    const {json,ttlMs}=encodeCatalogFreshnessAttestation({
      sourceSha256:snapshot,
      createdAt:created,
      lastVerifiedAt:verified,
      officialSha1:sha1,
      now,
    });
    expect(ttlMs).toBeGreaterThan(0);
    expect(ttlMs).toBeLessThanOrEqual(MAX_CATALOG_FRESHNESS_MS);
    redisState.get.mockResolvedValueOnce(json);

    const resolved=await resolveCatalogVerifiedAt({snapshot,createdAt:created,now});
    expect(resolved).toBe(Date.parse(verified));
    expect(redisState.get).toHaveBeenCalledTimes(1);
    expect(redisState.get).toHaveBeenCalledWith(catalogFreshnessKey(snapshot));

    // Within 30s observation window: reuses bounded observation without extra Redis GET.
    const second=await resolveCatalogVerifiedAt({snapshot,createdAt:created,now:now+10_000});
    expect(second).toBe(Date.parse(verified));
    expect(redisState.get).toHaveBeenCalledTimes(1);
  });

  it("rejects mismatched, malformed, expired, future-dated, out-of-order, and unavailable evidence",async()=>{
    const created="2026-11-22T00:00:00.000Z";
    const verified="2026-11-25T00:00:00.000Z";
    const now=Date.parse("2026-11-26T00:00:00.000Z"); // Within 7 days of created_at!
    const valid=encodeCatalogFreshnessAttestation({
      sourceSha256:snapshot,
      createdAt:created,
      lastVerifiedAt:verified,
      officialSha1:sha1,
      now,
    });

    // 1. Malformed JSON fails closed even when created_at < 7d
    redisState.get.mockResolvedValueOnce("{bad-json");
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:created,now})).rejects.toThrow(/Malformed/);
    resetCatalogFreshnessForTests();

    // 2. Mismatched snapshot SHA256
    const wrongSnapshot=JSON.stringify({...JSON.parse(valid.json),source_sha256:"e".repeat(64)});
    redisState.get.mockResolvedValueOnce(wrongSnapshot);
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:created,now})).rejects.toThrow(/Mismatched/);
    resetCatalogFreshnessForTests();

    // 3. Mismatched created_at
    redisState.get.mockResolvedValueOnce(valid.json);
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:"2026-11-21T00:00:00.000Z",now})).rejects.toThrow(/created_at/);
    resetCatalogFreshnessForTests();

    // 4. Invalid official_sha1
    const badSha1=JSON.stringify({...JSON.parse(valid.json),official_sha1:"not-a-sha1"});
    redisState.get.mockResolvedValueOnce(badSha1);
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:created,now})).rejects.toThrow(/Mismatched/);
    resetCatalogFreshnessForTests();

    // 5. Future-dated last_verified_at
    const futureMs=now+60_000;
    const futurePayload=JSON.stringify({
      ...JSON.parse(valid.json),
      last_verified_at:new Date(futureMs).toISOString(),
      verified_epoch_ms:futureMs,
    });
    redisState.get.mockResolvedValueOnce(futurePayload);
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:created,now})).rejects.toThrow(/Future-dated/);
    resetCatalogFreshnessForTests();

    // 6. Expired attestation (>7 days after last_verified_at)
    const afterExpiry=Date.parse(verified)+MAX_CATALOG_FRESHNESS_MS+1;
    redisState.get.mockResolvedValueOnce(valid.json);
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:created,now:afterExpiry})).rejects.toThrow(/Expired/);
    resetCatalogFreshnessForTests();

    // 7. Missing or unavailable Redis past 7-day created_at fails closed
    const oldCreated="2026-11-10T00:00:00.000Z";
    redisState.get.mockResolvedValueOnce(null);
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:oldCreated,now})).rejects.toThrow(/expired/);
    resetCatalogFreshnessForTests();

    redisState.get.mockRejectedValueOnce(new Error("redis timeout"));
    await expect(resolveCatalogVerifiedAt({snapshot,createdAt:oldCreated,now})).rejects.toThrow(/unavailable/);
  });
});
