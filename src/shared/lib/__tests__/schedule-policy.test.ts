import { describe, expect, it } from "vitest";
import {
  isWeeklyScheduleEligibleStatus,
  normalizePublicationStatus,
} from "../schedule-policy";

describe("weekly schedule publication policy", () => {
  it("excludes known completed, hiatus, and cancelled titles from future schedule (SCH-05)", () => {
    expect(isWeeklyScheduleEligibleStatus("COMPLETED")).toBe(false);
    expect(isWeeklyScheduleEligibleStatus("Tamat")).toBe(false);
    expect(isWeeklyScheduleEligibleStatus("cancelled")).toBe(false);
    expect(isWeeklyScheduleEligibleStatus("hiatus")).toBe(false);
  });

  it("keeps ongoing, publishing, and unknown legacy statuses eligible", () => {
    expect(isWeeklyScheduleEligibleStatus("ONGOING")).toBe(true);
    expect(isWeeklyScheduleEligibleStatus("publishing")).toBe(true);
    expect(isWeeklyScheduleEligibleStatus(undefined)).toBe(true);
  });

  it("normalizes hiatus explicitly so the UI can disclose it", () => {
    expect(normalizePublicationStatus("On Hiatus")).toBe("hiatus");
  });
});
