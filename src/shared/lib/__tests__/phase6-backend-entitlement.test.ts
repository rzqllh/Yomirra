import { beforeEach, describe, expect, it } from "vitest";
import { getEntitlements, isFeatureEntitled } from "../entitlement";
import { getFeatureFlags, isFeatureFlagEnabled } from "../feature-flags";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminRequest,
} from "@/server/lib/auth/admin-auth";

describe("Phase 6 — Backend, Entitlement, Admin Hardening, and AI", () => {
  describe("6.1 Admin Auth & Security Hardening", () => {
    beforeEach(() => {
      process.env.ADMIN_KEY = "phase6-admin-key";
      process.env.ADMIN_SESSION_SECRET = "phase6-session-secret";
      delete process.env.ADMIN_SECRET;
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    });

    it("rejects unauthorized requests with invalid tokens", async () => {
      const request = new Request("http://localhost:3000/api/admin/sources", {
        headers: {
          "x-admin-key": "wrong-key-123",
        },
      });

      const result = await verifyAdminRequest(request);
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe("invalid_token");
    });

    it("accepts authorized requests with valid x-admin-key header", async () => {
      const request = new Request("http://localhost:3000/api/admin/sources", {
        headers: {
          "x-admin-key": "phase6-admin-key",
        },
      });

      const result = await verifyAdminRequest(request);
      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe("admin-key");
      expect(result.method).toBe("api_key");
    });

    it("accepts authorized requests with a signed session cookie", async () => {
      const token = createAdminSessionToken("admin-key")!;
      const request = new Request("http://localhost:3000/api/admin/sources", {
        headers: {
          cookie: `${ADMIN_SESSION_COOKIE}=${token}`,
        },
      });

      const result = await verifyAdminRequest(request);
      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe("admin-key");
      expect(result.method).toBe("session");
    });

    it("accepts authorized requests with Bearer token", async () => {
      const request = new Request("http://localhost:3000/api/admin/sources", {
        headers: {
          authorization: "Bearer phase6-admin-key",
        },
      });

      const result = await verifyAdminRequest(request);
      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe("admin-key");
      expect(result.method).toBe("api_key");
    });
  });

  describe("6.2 & 6.3 Feature Flags & Entitlement Foundation", () => {
    it("guarantees all core reader, search, and library flows are unlocked on free tier", () => {
      const free = getEntitlements("free");

      expect(free.features.unlimitedReading).toBe(true);
      expect(free.features.fullSearch).toBe(true);
      expect(free.features.multiSourceSwitch).toBe(true);
      expect(free.features.offlineLibrary).toBe(true);
      expect(free.features.historySync).toBe(true);

      expect(free.features.aiSmartRecommendations).toBe(false);
      expect(free.features.aiTextAnalysis).toBe(false);
    });

    it("enables pro capabilities only on pro tier without degrading free features", () => {
      const pro = getEntitlements("pro");

      expect(pro.features.unlimitedReading).toBe(true);
      expect(pro.features.fullSearch).toBe(true);
      expect(pro.features.aiSmartRecommendations).toBe(true);
      expect(pro.features.aiTextAnalysis).toBe(true);
      expect(pro.features.cloudBackupExport).toBe(true);
    });

    it("accurately checks individual feature entitlements", () => {
      expect(isFeatureEntitled("unlimitedReading", "free")).toBe(true);
      expect(isFeatureEntitled("aiSmartRecommendations", "free")).toBe(false);
      expect(isFeatureEntitled("aiSmartRecommendations", "pro")).toBe(true);
    });

    it("evaluates feature flags with safe defaults and overrides", () => {
      const defaultFlags = getFeatureFlags();
      expect(defaultFlags.enableAiSearchIntelligence).toBe(true);
      expect(defaultFlags.enableCustomSources).toBe(true);

      const overriddenFlags = getFeatureFlags({ enableAiSearchIntelligence: false });
      expect(overriddenFlags.enableAiSearchIntelligence).toBe(false);
      expect(isFeatureFlagEnabled("enableCustomSources", overriddenFlags)).toBe(true);
    });
  });
});
