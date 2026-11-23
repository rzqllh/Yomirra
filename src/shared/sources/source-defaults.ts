/** Default off until each source passes catalog, detail, chapter, and page checks.
 * Users may opt in manually, without changing upstream monitoring status.
 */
export const DEFAULT_DISABLED_SOURCE_IDS = [
  "komikindo", "komiku", "komiknesia", "westmanga", "mangadex", "doujindesu",
] as const;

export const SOURCE_PREFERENCE_POLICY_VERSION = 1;

export function applyDefaultDisabledSources(ids: readonly string[]): string[] {
  return [...new Set([...DEFAULT_DISABLED_SOURCE_IDS, ...ids])];
}
