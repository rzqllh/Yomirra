import { describe, expect, it } from "vitest";
import {
  isWeeklyScheduleEligibleStatus,
  normalizePublicationStatus,
} from "../schedule-policy";

describe("weekly schedule publication policy", () => {
  it("excludes known completed and cancelled titles", () => {
    expect(isWeeklyScheduleEligibleStatus("COMPLETED")).toBe(false);
    expect(isWeeklyScheduleEligibleStatus("Tamat")).toBe(false);
    expect(isWeeklyScheduleEligibleStatus("cancelled")).toBe(false);
  });

  it("keeps ongoing, publishing, hiatus, and unknown legacy statuses eligible", () => {
    expect(isWeeklyScheduleEligibleStatus("ONGOING")).toBe(true);
    expect(isWeeklyScheduleEligibleStatus("publishing")).toBe(true);
    expect(isWeeklyScheduleEligibleStatus("hiatus")).toBe(true);
    expect(isWeeklyScheduleEligibleStatus(undefined)).toBe(true);
  });

  it("normalizes hiatus explicitly so the UI can disclose it", () => {
    expect(normalizePublicationStatus("On Hiatus")).toBe("hiatus");
  });
});
