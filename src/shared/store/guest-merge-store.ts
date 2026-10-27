import { create } from "zustand";
import type { GuestSnapshot, CloudSnapshot, MergeDiff } from "@/shared/lib/guest-merge-engine";

export interface PendingUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export interface MergeErrorState {
  user: PendingUser;
  errorMessage: string;
}

export interface GuestMergeState {
  isMergePending: boolean;
  pendingUser: PendingUser | null;
  guestSnapshot: GuestSnapshot | null;
  cloudSnapshot: CloudSnapshot | null;
  diff: MergeDiff | null;
  mergeError: MergeErrorState | null;

  startMergeReview: (params: {
    user: PendingUser;
    guestSnapshot: GuestSnapshot;
    cloudSnapshot: CloudSnapshot;
    diff: MergeDiff;
  }) => void;
  setMergeError: (params: MergeErrorState) => void;
  clearMergeError: () => void;
  resolveMergeReview: () => void;
  cancelMergeReview: () => void;
}

export const useGuestMergeStore = create<GuestMergeState>((set) => ({
  isMergePending: false,
  pendingUser: null,
  guestSnapshot: null,
  cloudSnapshot: null,
  diff: null,
  mergeError: null,

  startMergeReview: ({ user, guestSnapshot, cloudSnapshot, diff }) =>
    set({
      isMergePending: true,
      pendingUser: user,
      guestSnapshot,
      cloudSnapshot,
      diff,
      mergeError: null,
    }),

  setMergeError: (errorState) =>
    set({
      isMergePending: true, // Remains pending/blocked to prevent race conditions
      pendingUser: errorState.user,
      mergeError: errorState,
    }),

  clearMergeError: () =>
    set({
      mergeError: null,
    }),

  resolveMergeReview: () =>
    set({
      isMergePending: false,
      pendingUser: null,
      guestSnapshot: null,
      cloudSnapshot: null,
      diff: null,
      mergeError: null,
    }),

  cancelMergeReview: () =>
    set({
      isMergePending: false,
      pendingUser: null,
      guestSnapshot: null,
      cloudSnapshot: null,
      diff: null,
      mergeError: null,
    }),
}));
