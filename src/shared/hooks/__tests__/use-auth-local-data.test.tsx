import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLocalDataOwnerUid,
  setLocalDataOwnerUid,
} from "@/shared/lib/local-data-owner";

const authMocks = vi.hoisted(() => ({
  currentUser: { uid: "uid-a" } as { uid: string } | null,
  signOut: vi.fn(async () => undefined),
  clearUserScopedReadingState: vi.fn(),
}));

vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn(async () => ({ auth: {}, app: null, db: null })),
}));

vi.mock("@/shared/lib/local-data-cleanup", () => ({
  clearUserScopedReadingState: authMocks.clearUserScopedReadingState,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(
    (_auth: unknown, callback: (user: { uid: string } | null) => void) => {
      queueMicrotask(() => callback(authMocks.currentUser));
      return vi.fn();
    }
  ),
  signOut: authMocks.signOut,
  signInWithPopup: vi.fn(async () => undefined),
  GoogleAuthProvider: class GoogleAuthProvider {},
}));

import { useAuth } from "../use-auth";

describe("useAuth local data contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authMocks.currentUser = { uid: "uid-a" };
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
});
