/**
 * Outbox-First Activation Gate (PR-2 Dark Launch Guard)
 * Conforming to Q138 Architecture Specifications
 *
 * CRITICAL INVARIANT:
 * The new outbox path MUST remain strictly DISABLED unconditionally at runtime
 * (production, preview, and development) until PR-3 drainer, conflict resolution,
 * and Firebase Emulator E2E tests PASS.
 * Runtime activation via NEXT_PUBLIC_ENABLE_OUTBOX_SYNC is eliminated.
 * Test override is isolated strictly to process.env.NODE_ENV === "test".
 */

let outboxActivationOverride: boolean | null = null;

/**
 * Returns whether the journal-first outbox write path is currently active.
 * Unconditionally returns false in production and preview runtime environments.
 * Test override only functions when NODE_ENV === "test".
 */
export function isOutboxPathEnabled(): boolean {
  if (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV === "test" &&
    outboxActivationOverride !== null
  ) {
    return outboxActivationOverride;
  }

  return false;
}

/**
 * Allows test suites to toggle the outbox activation gate in isolated test environments.
 * Passing null resets the gate back to default runtime behavior.
 */
export function setOutboxPathEnabledForTesting(enabled: boolean | null): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
    outboxActivationOverride = enabled;
  }
}
