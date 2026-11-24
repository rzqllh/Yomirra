import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { verifyIdToken, getUserByEmail } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(), getUserByEmail: vi.fn(),
}));
vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []), cert: vi.fn(v => v) }));
vi.mock("firebase-admin/auth", () => ({getAuth: vi.fn(() => ({verifyIdToken,getUserByEmail}))}));
import { verifyPrivateBetaOwner } from "../admin-auth";

const req = (authorization = "Bearer test-token", extra: Record<string,string> = {}) =>
  new Request("https://example.test/api/private-beta/sources",{headers:{authorization,...extra}});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_KEY","{}");
  vi.stubEnv("YOMIRRA_PRIVATE_BETA_EMAIL","owner@example.test");
  verifyIdToken.mockResolvedValue({uid:"owner-uid",email:"owner@example.test",email_verified:true});
  getUserByEmail.mockResolvedValue({uid:"owner-uid",email:"owner@example.test",emailVerified:true,disabled:false});
});
afterEach(() => vi.unstubAllEnvs());
describe("private beta Firebase owner authorization", () => {
  it("requires a verified nonrevoked Firebase token and current matching UID", async () => {
    expect(await verifyPrivateBetaOwner(req())).toBe("owner-uid");
    expect(verifyIdToken).toHaveBeenCalledWith("test-token",true);
    expect(getUserByEmail).toHaveBeenCalledWith("owner@example.test");
  });
  it("rejects other users, unverified email, mismatched UID, disabled user and revoked token", async () => {
    verifyIdToken.mockResolvedValueOnce({uid:"other",email:"other@example.test",email_verified:true});
    expect(await verifyPrivateBetaOwner(req())).toBeNull();
    verifyIdToken.mockResolvedValueOnce({uid:"owner-uid",email:"owner@example.test",email_verified:false});
    expect(await verifyPrivateBetaOwner(req())).toBeNull();
    getUserByEmail.mockResolvedValueOnce({uid:"other-uid",email:"owner@example.test",emailVerified:true,disabled:false});
    expect(await verifyPrivateBetaOwner(req())).toBeNull();
    getUserByEmail.mockResolvedValueOnce({uid:"owner-uid",email:"owner@example.test",emailVerified:true,disabled:true});
    expect(await verifyPrivateBetaOwner(req())).toBeNull();
    verifyIdToken.mockRejectedValueOnce(new Error("revoked"));
    expect(await verifyPrivateBetaOwner(req())).toBeNull();
  });
  it("does not accept client email headers, admin keys or session cookies", async () => {
    expect(await verifyPrivateBetaOwner(req("",{"x-email":"owner@example.test","x-admin-key":"fake",cookie:"yomirra_admin_session=fake"}))).toBeNull();
    expect(verifyIdToken).not.toHaveBeenCalled();
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_EMAIL","");
    expect(await verifyPrivateBetaOwner(req())).toBeNull();
  });
});
