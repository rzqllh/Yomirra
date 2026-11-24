import {describe,it,expect} from "vitest";
import {toPublicSourceHealth} from "../public-health";
import type {SourceHealthSnapshot} from "../types";
const base:SourceHealthSnapshot={sourceId:"fixture",status:"HEALTHY",stage:"search",latencyMs:150,resolvedHost:"example.test",lastCheckedAt:"2026-11-25T00:00:00Z",lastSuccessAt:"2026-11-25T00:00:00Z",lastFailureAt:null,consecutiveFailures:0};
describe("public source coverage",()=>{
  it("distinguishes catalog, transport and chapter list from page references",()=>{
    expect(toPublicSourceHealth(base).coverage).toBe("catalog");
    expect(toPublicSourceHealth({...base,stage:"transport"}).coverage).toBe("transport");
    expect(toPublicSourceHealth({...base,stage:"chapters"}).coverage).toBe("chapters");
    expect(toPublicSourceHealth({...base,stage:"pages"}).coverage).toBe("unknown");
    expect(toPublicSourceHealth({...base,stage:"pages",metadata:{probeType:"deep",sampleChapterId:"fixture"}}).coverage).toBe("page-references");
  });
  it("does not establish reader evidence on failed or skipped page probes",()=>{
    expect(toPublicSourceHealth({...base,status:"DEGRADED",stage:"pages",metadata:{probeType:"deep",sampleChapterId:"fixture"}}).coverage).toBeUndefined();
    expect(toPublicSourceHealth({...base,stage:"pages",metadata:{probeType:"deep",sampleChapterId:"fixture",pagesSkipped:"locked"}}).coverage).toBe("unknown");
  });
});
