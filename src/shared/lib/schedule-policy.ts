export type NormalizedPublicationStatus =
  | "ongoing"
  | "hiatus"
  | "completed"
  | "cancelled"
  | "unknown";

const COMPLETED_STATUSES = new Set([
  "completed",
  "complete",
  "finished",
  "tamat",
  "selesai",
]);

const CANCELLED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "dibatalkan",
]);

const HIATUS_STATUSES = new Set([
  "hiatus",
  "paused",
  "on hiatus",
]);

const ONGOING_STATUSES = new Set([
  "ongoing",
  "publishing",
  "active",
  "releasing",
]);

export function normalizePublicationStatus(
  status?: string | null
): NormalizedPublicationStatus {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "unknown";
  if (COMPLETED_STATUSES.has(normalized)) return "completed";
  if (CANCELLED_STATUSES.has(normalized)) return "cancelled";
  if (HIATUS_STATUSES.has(normalized)) return "hiatus";
  if (ONGOING_STATUSES.has(normalized)) return "ongoing";
  return "unknown";
}

/**
 * A manual release day changes scheduling only; it never changes publication
 * eligibility. Known completed/cancelled titles therefore stay out of the
 * future schedule.
 */
export function isWeeklyScheduleEligibleStatus(
  status?: string | null
): boolean {
  const normalized = normalizePublicationStatus(status);
  return normalized !== "completed" && normalized !== "cancelled";
}
