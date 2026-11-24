import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { verifyPrivateBetaOwner } from "@/server/lib/auth/admin-auth";
import { fetchPrivateBetaPage, readPrivateBetaDetail, readPrivateBetaChapter, privateBetaAllowsSource } from "@/server/lib/sources/private-beta";
vi.mock("@/server/lib/auth/admin-auth",()=>({verifyPrivateBetaOwner:vi.fn()}));
vi.mock("@/server/lib/security/rate-limit",()=>({checkRateLimit:vi.fn(async()=>({success:true}))}));
vi.mock("@/server/lib/sources/private-beta",()=>({fetchPrivateBetaPage:vi.fn(),readPrivateBetaDetail:vi.fn(),readPrivateBetaChapter:vi.fn(),privateBetaAllowsSource:vi.fn(),validBetaIdentity:(v:unknown)=>typeof v==="string"&&!!v}));
const request=(body:unknown)=>new NextRequest("https://example.test/api/private-beta/reader",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();vi.mocked(verifyPrivateBetaOwner).mockResolvedValue(null);});
describe("private reader admission",()=>{
  it("denies every operation without verified owner identity",async()=>{
    for(const operation of ["detail","chapter","image"]) {
      const res=await POST(request({operation,source:"manhwa-list",mangaId:"manga",chapterId:"chapter",ticket:"fake"}));
      expect(res.status).toBe(404);
      expect(res.headers.get("cache-control")).toContain("no-store");
    }
    expect(readPrivateBetaDetail).not.toHaveBeenCalled();expect(readPrivateBetaChapter).not.toHaveBeenCalled();expect(fetchPrivateBetaPage).not.toHaveBeenCalled();
  });
  it("requires approved sources and binds image requests to authenticated UID",async()=>{
    vi.mocked(verifyPrivateBetaOwner).mockResolvedValue("owner");
    vi.mocked(privateBetaAllowsSource).mockReturnValue(false);
    expect((await POST(request({operation:"chapter",source:"manhwa-list",mangaId:"manga",chapterId:"chapter"}))).status).toBe(403);
    vi.mocked(fetchPrivateBetaPage).mockResolvedValue(null);
    expect((await POST(request({operation:"image",ticket:"fixture"}))).status).toBe(403);
    expect(fetchPrivateBetaPage).toHaveBeenCalledWith("fixture","owner",expect.anything());
  });
});
