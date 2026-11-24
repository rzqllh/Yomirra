import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyPrivateBetaRestIdentity } from "../private-beta-rest";
const now = () => Math.floor(Date.now()/1000);
const jwt = (overrides: Record<string,unknown> = {}) => [
  Buffer.from(JSON.stringify({alg:"RS256",kid:"fixture"})).toString("base64url"),
  Buffer.from(JSON.stringify({aud:"fixture-project",iss:"https://securetoken.google.com/fixture-project",sub:"fixture-uid",email:"owner@example.test",email_verified:true,iat:now()-10,auth_time:now()-20,exp:now()+300,...overrides})).toString("base64url"),
  "test-signature"
].join(".");
const account = (overrides: Record<string,unknown> = {}) => ({localId:"fixture-uid",email:"owner@example.test",emailVerified:true,validSince:String(now()-60),...overrides});
const google = (record: unknown = account(), status=200) => {
  const f=vi.fn().mockResolvedValue(new Response(JSON.stringify({users:[record]}),{status}));
  vi.stubGlobal("fetch",f);return f;
};
beforeEach(() => {vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY","fixture-key");vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID","fixture-project");});
afterEach(() => {vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe("Firebase REST beta identity", () => {
  it("authenticates through Google and validates the current account UID", async () => {
    const token=jwt(),f=google();
    expect(await verifyPrivateBetaRestIdentity(token,"owner@example.test")).toBe("fixture-uid");
    expect(String(f.mock.calls[0][0])).toBe("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=fixture-key");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({idToken:token});
  });
  it("fails closed on rejected token, missing revocation boundary and wrong identity", async () => {
    google(account(),400);
    expect(await verifyPrivateBetaRestIdentity(jwt(),"owner@example.test")).toBeNull();
    for(const row of [account({validSince:undefined}),account({validSince:String(now()-5)}),account({emailVerified:false}),account({disabled:true}),account({localId:"other"}),account({email:"other@example.test"})]){
      google(row);
      expect(await verifyPrivateBetaRestIdentity(jwt(),"owner@example.test")).toBeNull();
    }
    google();
    expect(await verifyPrivateBetaRestIdentity(jwt({aud:"wrong-project"}),"owner@example.test")).toBeNull();
    google();
    expect(await verifyPrivateBetaRestIdentity(jwt({exp:now()-1}),"owner@example.test")).toBeNull();
  });
});
