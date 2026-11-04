/**
 * Outbox-First Activation Gate (PR-2 Dark Launch Guard)
 * Conforming to Q138 Architecture Specifications
 *
 * CRITICAL INVARIANT:
 * The new outbox path MUST remain strictly DISABLED by default on runtime
 * until PR-3 drainer, conflict resolution, and Firebase Emulator E2E tests PASS.
 */

let outboxActivationOverride: boolean | null = null;

/**
 * Returns whether the journal-first outbox write path is currently active.
 * Defaults to false unless explicitly enabled via environment or test override.
 */
export function isOutboxPathEnabled(): boolean {
  if (outboxActivationOverride !== null) {
    return outboxActivationOverride;
  }

  if (
    typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_ENABLE_OUTBOX_SYNC === "true"
  ) {
    return true;
  }

  return false;
}

/**
 * Allows test suites to toggle the outbox activation gate in isolated environments.
 * Passing null resets the gate back to default runtime behavior.
 */
export function setOutboxPathEnabledForTesting(enabled: boolean | null): void {
  outboxActivationOverride = enabled;
}
