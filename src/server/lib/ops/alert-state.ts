import { redis } from "../cache/redis";

export interface AlertState {
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  consecutiveFailures: number;
  alertedAt: string | null;
  recoveredAt: string | null;
  cooldownUntil: string | null;
}

const ALERT_STATE_PREFIX = "yomirra:ops:alert:";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Retrieves the current deduplication state for an alert fingerprint.
 */
export async function getAlertState(fingerprint: string): Promise<AlertState | null> {
  try {
    const data = await redis.get(`${ALERT_STATE_PREFIX}${fingerprint}`);
    if (!data) return null;
    return JSON.parse(data) as AlertState;
  } catch {
    return null;
  }
}

/**
 * Saves the deduplication state for an alert fingerprint.
 */
export async function saveAlertState(state: AlertState): Promise<void> {
  try {
    await redis.set(
      `${ALERT_STATE_PREFIX}${state.fingerprint}`,
      JSON.stringify(state),
      "EX",
      TTL_SECONDS
    );
  } catch {
    // Redis unavailable, skip persistence
  }
}

/**
 * Clears the deduplication state for an alert fingerprint.
 */
export async function clearAlertState(fingerprint: string): Promise<void> {
  try {
    await redis.del(`${ALERT_STATE_PREFIX}${fingerprint}`);
  } catch {
    // Redis unavailable, skip deletion
  }
}
