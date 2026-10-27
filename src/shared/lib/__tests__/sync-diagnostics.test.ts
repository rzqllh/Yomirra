import { describe, it, expect, beforeEach } from "vitest";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";

describe("SyncDiagnosticsStore (Q127 Honest Sync Diagnostics)", () => {
  beforeEach(() => {
    localStorage.clear();
    useSyncDiagnosticsStore.getState().resetDiagnostics();
  });

  it("starts in an honest idle state with zero fake successful commits", () => {
    const state = useSyncDiagnosticsStore.getState();
    expect(state.currentUid).toBeNull();
    expect(state.lifecycleState).toBe("idle");
    expect(state.lastSuccessfulSyncAt).toBeNull();
    expect(state.lastSyncError).toBeNull();
    expect(state.cloudReachable).toBeNull();
    expect(Object.keys(state.domainRecords)).toHaveLength(0);
  });

  it("distinguishes network offline from Firebase reachability", () => {
    const store = useSyncDiagnosticsStore.getState();

    // Turn network off
    store.setNetworkOnline(false);
    let current = useSyncDiagnosticsStore.getState();
    expect(current.networkOnline).toBe(false);
    expect(current.cloudReachable).toBe(false);
    expect(current.lifecycleState).toBe("offline");

    // Turn network back on: network is online, but cloudReachable is not yet verified
    store.setNetworkOnline(true);
    current = useSyncDiagnosticsStore.getState();
    expect(current.networkOnline).toBe(true);
    expect(current.lifecycleState).toBe("idle");
  });

  it("transitions lifecycle through syncing and records successful commit per domain with honest write vs read separation", () => {
    const store = useSyncDiagnosticsStore.getState();

    store.recordSyncStart();
    expect(useSyncDiagnosticsStore.getState().lifecycleState).toBe("syncing");

    const commitTimestamp = "2026-10-27T12:00:00.000Z";
    store.recordSuccessfulCommit({
      uid: "user-alpha",
      domains: [
        { domain: "library", successfulWriteCount: 15, verifiedReadCount: 20 },
        { domain: "history", successfulWriteCount: 42, verifiedReadCount: 50 },
      ],
      timestamp: commitTimestamp,
    });

    const afterCommit = useSyncDiagnosticsStore.getState();
    expect(afterCommit.currentUid).toBe("user-alpha");
    expect(afterCommit.lifecycleState).toBe("successful commit");
    expect(afterCommit.cloudReachable).toBe(true);
    expect(afterCommit.lastSuccessfulSyncAt).toBe(commitTimestamp);

    // Only domains with actual evidence exist!
    expect(afterCommit.domainRecords["library"]).toBeDefined();
    expect(afterCommit.domainRecords["library"].successfulWriteCount).toBe(15);
    expect(afterCommit.domainRecords["library"].verifiedReadCount).toBe(20);
    expect(afterCommit.domainRecords["library"].status).toBe("synced");

    expect(afterCommit.domainRecords["history"]).toBeDefined();
    expect(afterCommit.domainRecords["history"].successfulWriteCount).toBe(42);
    expect(afterCommit.domainRecords["history"].verifiedReadCount).toBe(50);
    expect(afterCommit.domainRecords["history"].status).toBe("synced");

    // Preferences domain was not in this commit, so it must NOT have a fake record
    expect(afterCommit.domainRecords["preferences"]).toBeUndefined();
  });

  it("isolates diagnostics by UID on account switch and logout", () => {
    const store = useSyncDiagnosticsStore.getState();

    store.recordSuccessfulCommit({
      uid: "user-A",
      domains: [
        { domain: "library", successfulWriteCount: 10, verifiedReadCount: 10 },
      ],
      timestamp: "2026-10-27T10:00:00.000Z",
    });

    expect(useSyncDiagnosticsStore.getState().currentUid).toBe("user-A");
    expect(useSyncDiagnosticsStore.getState().domainRecords["library"]).toBeDefined();

    // Switch to User B -> User A's sync state must be purged
    store.handleUserSwitch("user-B");
    const userBState = useSyncDiagnosticsStore.getState();
    expect(userBState.currentUid).toBe("user-B");
    expect(userBState.lastSuccessfulSyncAt).toBeNull();
    expect(userBState.domainRecords).toEqual({});

    // Logout -> must be purged
    store.handleUserSwitch(null);
    const logoutState = useSyncDiagnosticsStore.getState();
    expect(logoutState.currentUid).toBeNull();
    expect(logoutState.domainRecords).toEqual({});
  });

  it("records sync failure honestly and marks cloud unreachable on network errors", () => {
    const store = useSyncDiagnosticsStore.getState();

    store.recordSyncStart();
    store.recordSyncFailure("Firestore service unavailable: DEADLINE_EXCEEDED", true);

    const afterFail = useSyncDiagnosticsStore.getState();
    expect(afterFail.lifecycleState).toBe("failed");
    expect(afterFail.cloudReachable).toBe(false);
    expect(afterFail.lastSyncError).toContain("DEADLINE_EXCEEDED");
  });
});
