import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCAL_DATA_OWNER_KEY,
  clearLocalDataOwnerUid,
  getLocalDataOwnerUid,
  setLocalDataOwnerUid,
  shouldResetLocalDataForAccount,
} from "../local-data-owner";

describe("local data ownership", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("preserves local data for logout and the same returning account", () => {
    setLocalDataOwnerUid("uid-a");

    expect(getLocalDataOwnerUid()).toBe("uid-a");
    expect(shouldResetLocalDataForAccount("uid-a", "uid-a")).toBe(false);
  });

  it("requires local user-scoped data reset before a different account syncs", () => {
    expect(shouldResetLocalDataForAccount("uid-a", "uid-b")).toBe(true);
    expect(shouldResetLocalDataForAccount(null, "uid-b")).toBe(false);
  });

  it("removes the ownership marker during shared-device cleanup", () => {
    localStorage.setItem(LOCAL_DATA_OWNER_KEY, "uid-a");
    clearLocalDataOwnerUid();
    expect(localStorage.getItem(LOCAL_DATA_OWNER_KEY)).toBeNull();
  });
});
