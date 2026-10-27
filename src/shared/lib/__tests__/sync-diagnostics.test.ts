import { describe, it, expect, beforeEach } from "vitest";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";

describe("SyncDiagnosticsStore (Q127 Honest Sync Diagnostics)", () => {
  beforeEach(() => {
    localStorage.clear();
    useSyncDiagnosticsStore.getState().resetDiagnostics();
  });

  it("starts in an honest idle state with zero fake successful commits", () => {
    const state = useSyncDiagnosticsStore.getState();
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

  it("transitions lifecycle through syncing and records successful commit per domain", () => {
    const store = useSyncDiagnosticsStore.getState();

    store.recordSyncStart();
    expect(useSyncDiagnosticsStore.getState().lifecycleState).toBe("syncing");

    const commitTimestamp = "2026-10-27T12:00:00.000Z";
    store.recordSuccessfulCommit({
      domains: [
        { domain: "library", committedCount: 15, pulledCount: 20 },
        { domain: "history", committedCount: 42, pulledCount: 50 },
      ],
      timestamp: commitTimestamp,
    });

    const afterCommit = useSyncDiagnosticsStore.getState();
    expect(afterCommit.lifecycleState).toBe("successful commit");
    expect(afterCommit.cloudReachable).toBe(true);
    expect(afterCommit.lastSuccessfulSyncAt).toBe(commitTimestamp);

    // Only domains with actual evidence exist!
    expect(afterCommit.domainRecords["library"]).toBeDefined();
    expect(afterCommit.domainRecords["library"].committedCount).toBe(15);
    expect(afterCommit.domainRecords["library"].status).toBe("synced");

    expect(afterCommit.domainRecords["history"]).toBeDefined();
    expect(afterCommit.domainRecords["history"].committedCount).toBe(42);
    expect(afterCommit.domainRecords["history"].status).toBe("synced");

    // Preferences domain was not in this commit, so it must NOT have a fake record
    expect(afterCommit.domainRecords["preferences"]).toBeUndefined();
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
