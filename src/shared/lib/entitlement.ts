/**
 * Task 02 — Entitlement Foundation
 *
 * Free vs Pro capability model with server-authoritative defaults.
 * Core reader, search, multi-source, and bookmarking flows are ALWAYS free
 * and can NEVER be locked behind paywalls.
 */

export type UserTier = "free" | "pro";

export interface FeatureEntitlements {
  // Core free features — always guaranteed true for all users
  unlimitedReading: boolean;
  fullSearch: boolean;
  multiSourceSwitch: boolean;
  offlineLibrary: boolean;
  historySync: boolean;

  // Optional Pro / power features
  aiSmartRecommendations: boolean;
  aiTextAnalysis: boolean;
  highBandwidthImagePriority: boolean;
  cloudBackupExport: boolean;
}

export interface Entitlements {
  tier: UserTier;
  features: FeatureEntitlements;
  verifiedAt: number;
}

const FREE_FEATURES: FeatureEntitlements = {
  unlimitedReading: true,
  fullSearch: true,
  multiSourceSwitch: true,
  offlineLibrary: true,
  historySync: true,

  aiSmartRecommendations: false,
  aiTextAnalysis: false,
  highBandwidthImagePriority: false,
  cloudBackupExport: false,
};

const PRO_FEATURES: FeatureEntitlements = {
  unlimitedReading: true,
  fullSearch: true,
  multiSourceSwitch: true,
  offlineLibrary: true,
  historySync: true,

  aiSmartRecommendations: true,
  aiTextAnalysis: true,
  highBandwidthImagePriority: true,
  cloudBackupExport: true,
};

export function getEntitlements(tier: UserTier = "free"): Entitlements {
  const isPro = tier === "pro";
  return {
    tier: isPro ? "pro" : "free",
    features: isPro ? { ...PRO_FEATURES } : { ...FREE_FEATURES },
    verifiedAt: Date.now(),
  };
}

export function isFeatureEntitled(
  feature: keyof FeatureEntitlements,
  tier: UserTier = "free"
): boolean {
  const entitlements = getEntitlements(tier);
  return entitlements.features[feature] === true;
}
