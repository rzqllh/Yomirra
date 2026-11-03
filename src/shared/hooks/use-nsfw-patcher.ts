/**
 * @deprecated Legacy NSFW metadata backfill is intentionally disabled.
 *
 * Source classification is a presentation-time concern. Library and History
 * must retain the exact metadata saved by the user/provider; reclassifying
 * persisted entries on app mount risks irreversible false positives.
 *
 * Kept as a no-op for compatibility with older imports. Do not reintroduce
 * data mutations here. Any future migration needs a separate backup, dry run,
 * reversible plan and explicit owner approval.
 */
export function useNsfwPatcher(): void {
  // Intentionally no side effects or storage writes.
}
