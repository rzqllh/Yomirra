import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { verifyPrivateBetaOwner } from "@/server/lib/auth/admin-auth";
import { privateBetaAllowsSource, readPrivateBetaCatalog } from "@/server/lib/sources/private-beta";
vi.mock("@/server/lib/auth/admin-auth", () => ({verifyPrivateBetaOwner:vi.fn()}));
vi.mock("@/server/lib/security/rate-limit", () => ({checkRateLimit:vi.fn(async () => ({success:true}))}));
vi.mock("@/server/lib/sources/private-beta", () => ({privateBetaSources:vi.fn(() => [{id:"fixture",name:"Fixture",available:false}]),privateBetaAllowsSource:vi.fn(),readPrivateBetaCatalog:vi.fn()}));
const request = (suffix = "", token = "") => new NextRequest("https://example.test/api/private-beta/sources"+suffix,{headers:{authorization:token}});
beforeEach(() => {vi.clearAllMocks();vi.mocked(verifyPrivateBetaOwner).mockResolvedValue(null);vi.mocked(privateBetaAllowsSource).mockReturnValue(false);});
describe("private beta API boundary", () => {
  it("does not disclose source data or call adapters to guest/other user", async () => {
    for(const token of ["","Bearer another-user"]){
      const res=await GET(request("?source=fixture",token));
      expect(res.status).toBe(404);
      expect(res.headers.get("cache-control")).toContain("no-store");
    }
    expect(readPrivateBetaCatalog).not.toHaveBeenCalled();
  });
  it("returns the owner inventory privately but refuses unapproved sources", async () => {
    vi.mocked(verifyPrivateBetaOwner).mockResolvedValue("verified-uid");
    const res=await GET(request("","Bearer valid"));
    expect(res.status).toBe(200);
    expect(res.headers.get("vary")).toBe("Authorization");
    expect(res.headers.get("cache-control")).toContain("private");
    expect((await GET(request("?source=fixture","Bearer valid"))).status).toBe(403);
    expect(readPrivateBetaCatalog).not.toHaveBeenCalled();
  });
});
