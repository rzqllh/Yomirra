/**
 * Feature Flags System
 *
 * Provides safe defaults and environment/server overrides.
 * Flags default to safe values to avoid breaking SSR or client experiences.
 */

export interface AppFeatureFlags {
  enableAiSearchIntelligence: boolean;
  enableCustomSources: boolean;
  enableCommunityReports: boolean;
  enableAdvancedReaderGestures: boolean;
  enableCloudSync: boolean;
}

const DEFAULT_FLAGS: AppFeatureFlags = {
  enableAiSearchIntelligence: true,
  enableCustomSources: true,
  enableCommunityReports: true,
  enableAdvancedReaderGestures: true,
  enableCloudSync: true,
};

export function getFeatureFlags(overrides?: Partial<AppFeatureFlags>): AppFeatureFlags {
  return {
    ...DEFAULT_FLAGS,
    ...overrides,
  };
}

export function isFeatureFlagEnabled(
  flag: keyof AppFeatureFlags,
  overrides?: Partial<AppFeatureFlags>
): boolean {
  const flags = getFeatureFlags(overrides);
  return flags[flag] === true;
}
