import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SyncLifecycleState =
  | "idle"
  | "syncing"
  | "successful commit"
  | "pending"
  | "failed"
  | "offline";

export interface DomainSyncRecord {
  domain: "library" | "history" | "collections" | "preferences";
  status: "synced" | "pending" | "failed";
  successfulWriteCount: number;
  verifiedReadCount: number;
  lastCommittedAt: string;
}

export interface SyncDiagnosticsState {
  currentUid: string | null;
  lifecycleState: SyncLifecycleState;
  networkOnline: boolean;
  cloudReachable: boolean | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncError: string | null;
  domainRecords: Record<string, DomainSyncRecord>;

  handleUserSwitch: (newUid: string | null) => void;
  setLifecycleState: (state: SyncLifecycleState) => void;
  setNetworkOnline: (online: boolean) => void;
  setCloudReachable: (reachable: boolean | null) => void;
  recordSyncStart: () => void;
  recordSuccessfulCommit: (params: {
    uid: string;
    domains: Array<{
      domain: "library" | "history" | "collections" | "preferences";
      successfulWriteCount: number;
      verifiedReadCount: number;
    }>;
    timestamp?: string;
  }) => void;
  recordSyncFailure: (errorMessage: string, isCloudUnreachable?: boolean) => void;
  resetDiagnostics: () => void;
}

export const useSyncDiagnosticsStore = create<SyncDiagnosticsState>()(
  persist(
    (set) => ({
      currentUid: null,
      lifecycleState: "idle",
      networkOnline: typeof window !== "undefined" ? window.navigator.onLine : true,
      cloudReachable: null,
      lastSuccessfulSyncAt: null,
      lastSyncError: null,
      domainRecords: {},

      handleUserSwitch: (newUid) => {
        set((state) => {
          if (state.currentUid === newUid) return {};
          return {
            currentUid: newUid,
            lifecycleState: "idle",
            cloudReachable: null,
            lastSuccessfulSyncAt: null,
            lastSyncError: null,
            domainRecords: {},
          };
        });
      },

      setLifecycleState: (lifecycleState) => set({ lifecycleState }),

      setNetworkOnline: (networkOnline) => {
        set((state) => {
          if (!networkOnline) {
            return {
              networkOnline: false,
              cloudReachable: false,
              lifecycleState: "offline",
            };
          }
          return {
            networkOnline: true,
            lifecycleState: state.lifecycleState === "offline" ? "idle" : state.lifecycleState,
          };
        });
      },

      setCloudReachable: (cloudReachable) => set({ cloudReachable }),

      recordSyncStart: () => {
        set((state) => ({
          lifecycleState: state.networkOnline ? "syncing" : "offline",
          lastSyncError: null,
        }));
      },

      recordSuccessfulCommit: ({ uid, domains, timestamp }) => {
        const commitTime = timestamp || new Date().toISOString();
        set((state) => {
          const nextRecords = { ...state.domainRecords };
          for (const d of domains) {
            nextRecords[d.domain] = {
              domain: d.domain,
              status: "synced",
              successfulWriteCount: d.successfulWriteCount,
              verifiedReadCount: d.verifiedReadCount,
              lastCommittedAt: commitTime,
            };
          }
          return {
            currentUid: uid,
            lifecycleState: "successful commit",
            cloudReachable: true,
            lastSuccessfulSyncAt: commitTime,
            lastSyncError: null,
            domainRecords: nextRecords,
          };
        });
      },

      recordSyncFailure: (errorMessage, isCloudUnreachable = false) => {
        set((state) => ({
          lifecycleState: state.networkOnline ? "failed" : "offline",
          cloudReachable: isCloudUnreachable ? false : state.cloudReachable,
          lastSyncError: errorMessage,
        }));
      },

      resetDiagnostics: () => {
        set({
          currentUid: null,
          lifecycleState: "idle",
          cloudReachable: null,
          lastSuccessfulSyncAt: null,
          lastSyncError: null,
          domainRecords: {},
        });
      },
    }),
    {
      name: "yomirra-sync-diagnostics",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUid: state.currentUid,
        lastSuccessfulSyncAt: state.lastSuccessfulSyncAt,
        domainRecords: state.domainRecords,
      }),
    }
  )
);
