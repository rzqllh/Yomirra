import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLocalDataOwnerUid,
  setLocalDataOwnerUid,
  clearLocalDataOwnerUid,
} from "@/shared/lib/local-data-owner";

let authStateCallback: ((user: { uid: string } | null) => void) | null = null;

const authMocks = vi.hoisted(() => ({
  currentUser: { uid: "uid-a" } as { uid: string } | null,
  signOut: vi.fn(async () => undefined),
  clearUserScopedReadingState: vi.fn(),
}));

vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn(async () => ({ auth: { id: "mock-auth" }, app: null, db: null })),
}));

vi.mock("@/shared/lib/local-data-cleanup", () => ({
  clearUserScopedReadingState: authMocks.clearUserScopedReadingState,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(
    (_auth: unknown, callback: (user: { uid: string } | null) => void) => {
      authStateCallback = callback;
      queueMicrotask(() => callback(authMocks.currentUser));
      return vi.fn();
    }
  ),
  signOut: authMocks.signOut,
  signInWithPopup: vi.fn(async () => undefined),
  GoogleAuthProvider: class GoogleAuthProvider {},
}));

vi.mock("@/shared/lib/guest-merge-engine", () => ({
  shouldPromptGuestMerge: vi.fn(() => true),
  fetchCloudSnapshot: vi.fn(async () => {
    await new Promise((r) => setTimeout(r, 60));
    return { library: { "cloud-item": { id: "cloud-item" } }, history: {} };
  }),
  computeMergeDiff: vi.fn(() => ({
    hasCloudData: true,
    conflictingLibrary: [],
  })),
}));

import { useAuth, _resetGlobalAuthForTesting } from "../use-auth";

describe("useAuth local data contract", () => {
  beforeEach(() => {
    _resetGlobalAuthForTesting();
    vi.clearAllMocks();
    localStorage.clear();
    authMocks.currentUser = { uid: "uid-a" };
    authStateCallback = null;
  });

  it("does not delete device-local reading data on ordinary logout", async () => {
    setLocalDataOwnerUid("uid-a");

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    expect(authMocks.clearUserScopedReadingState).not.toHaveBeenCalled();
    expect(getLocalDataOwnerUid()).toBe("uid-a");
  });

  it("clears user-scoped local reading data before a different account becomes owner", async () => {
    setLocalDataOwnerUid("uid-a");
    authMocks.currentUser = { uid: "uid-b" };

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(authMocks.clearUserScopedReadingState).toHaveBeenCalledTimes(1);
    expect(getLocalDataOwnerUid()).toBe("uid-b");
    expect(result.current.user?.uid).toBe("uid-b");
  });

  it("drops stale in-flight cloud snapshot when auth state transitions before fetch completes", async () => {
    const { useGuestMergeStore } = await import("@/shared/store/guest-merge-store");
    clearLocalDataOwnerUid();
    useGuestMergeStore.getState().cancelMergeReview();

    authMocks.currentUser = null;
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Simulate transition 1: user logs in -> triggers in-flight fetchCloudSnapshot (60ms)
    await act(async () => {
      if (authStateCallback) {
        authStateCallback({ uid: "uid-in-flight" });
      }
    });

    // Simulate transition 2 (race condition): user switches or logs out before 60ms completes
    await act(async () => {
      if (authStateCallback) {
        authStateCallback(null);
      }
    });

    // Wait past the in-flight delay
    await new Promise((r) => setTimeout(r, 80));

    // Stale merge review for uid-in-flight must NOT have opened!
    expect(useGuestMergeStore.getState().isMergePending).toBe(false);
    expect(getLocalDataOwnerUid()).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
