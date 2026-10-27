import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { initFirebase } from "@/shared/lib/firebase";
import {
  getLocalDataOwnerUid,
  setLocalDataOwnerUid,
  shouldResetLocalDataForAccount,
} from "@/shared/lib/local-data-owner";
import { clearUserScopedReadingState } from "@/shared/lib/local-data-cleanup";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import {
  shouldPromptGuestMerge,
  fetchCloudSnapshot,
  computeMergeDiff,
} from "@/shared/lib/guest-merge-engine";
import { useGuestMergeStore } from "@/shared/store/guest-merge-store";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";

// Module-level singleton state to prevent competing listeners and race conditions
let globalUser: User | null = null;
let globalLoading = true;
let globalUnsubscribe: (() => void) | null = null;
let isSettingUpAuth = false;
let currentProcessingUid: string | null = null;

const subscribers = new Set<(user: User | null, loading: boolean) => void>();

function notifySubscribers() {
  for (const sub of subscribers) {
    sub(globalUser, globalLoading);
  }
}

async function handleAuthStateTransition(currentUser: User | null) {
  const newUid = currentUser?.uid || null;

  if (newUid === currentProcessingUid && globalUser?.uid === newUid) {
    return;
  }
  currentProcessingUid = newUid;

  if (!newUid) {
    globalUser = null;
    globalLoading = false;
    useGuestMergeStore.getState().cancelMergeReview();
    useSyncDiagnosticsStore.getState().handleUserSwitch(null);
    notifySubscribers();
    return;
  }

  const currentOwnerUid = getLocalDataOwnerUid();

  if (shouldResetLocalDataForAccount(currentOwnerUid, newUid)) {
    clearUserScopedReadingState();
    setLocalDataOwnerUid(newUid);
    useSyncDiagnosticsStore.getState().handleUserSwitch(newUid);
  } else if (currentOwnerUid === null) {
    // Guest transition!
    const guestLib = useLibraryStore.getState().items || {};
    const guestHist = useHistoryStore.getState().items || {};
    const guestSnapshot = { library: guestLib, history: guestHist };

    if (shouldPromptGuestMerge(guestSnapshot)) {
      try {
        const cloudSnapshot = await fetchCloudSnapshot(newUid);
        const diff = computeMergeDiff(guestSnapshot, cloudSnapshot);

        if (diff.hasCloudData || diff.conflictingLibrary.length > 0) {
          useGuestMergeStore.getState().startMergeReview({
            user: {
              uid: newUid,
              displayName: currentUser?.displayName ?? null,
              email: currentUser?.email ?? null,
              photoURL: currentUser?.photoURL ?? null,
            },
            guestSnapshot,
            cloudSnapshot,
            diff,
          });
          // FAIL-CLOSED / ISOLATION: Do NOT assign ownership!
          globalUser = currentUser;
          globalLoading = false;
          notifySubscribers();
          return;
        } else {
          // Cloud is empty, seamless safe adoption
          setLocalDataOwnerUid(newUid);
          useSyncDiagnosticsStore.getState().handleUserSwitch(newUid);
        }
      } catch (e: any) {
        console.error("Failed to read cloud snapshot for guest merge", e);
        // FAIL-CLOSED: Do NOT setLocalDataOwnerUid!
        useGuestMergeStore.getState().setMergeError({
          user: {
            uid: newUid,
            displayName: currentUser?.displayName ?? null,
            email: currentUser?.email ?? null,
            photoURL: currentUser?.photoURL ?? null,
          },
          errorMessage: e?.message || "Gagal membaca data dari cloud. Periksa sambungan internet.",
        });
        globalUser = currentUser;
        globalLoading = false;
        notifySubscribers();
        return;
      }
    } else {
      setLocalDataOwnerUid(newUid);
      useSyncDiagnosticsStore.getState().handleUserSwitch(newUid);
    }
  } else {
    setLocalDataOwnerUid(newUid);
    useSyncDiagnosticsStore.getState().handleUserSwitch(newUid);
  }

  globalUser = currentUser;
  globalLoading = false;
  notifySubscribers();
}

function ensureAuthCoordinator() {
  if (globalUnsubscribe || isSettingUpAuth) return;
  isSettingUpAuth = true;

  initFirebase().then(({ auth }) => {
    if (!auth) {
      globalLoading = false;
      isSettingUpAuth = false;
      notifySubscribers();
      return;
    }

    import("firebase/auth").then(({ onAuthStateChanged }) => {
      globalUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        await handleAuthStateTransition(currentUser);
      });
      isSettingUpAuth = false;
    }).catch((e) => {
      console.error("Failed to attach auth state listener", e);
      globalLoading = false;
      isSettingUpAuth = false;
      notifySubscribers();
    });
  }).catch((e) => {
    console.error("Failed to init Firebase for auth coordinator", e);
    globalLoading = false;
    isSettingUpAuth = false;
    notifySubscribers();
  });
}

export function _resetGlobalAuthForTesting() {
  if (globalUnsubscribe) {
    globalUnsubscribe();
    globalUnsubscribe = null;
  }
  globalUser = null;
  globalLoading = true;
  isSettingUpAuth = false;
  currentProcessingUid = null;
  subscribers.clear();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [loading, setLoading] = useState(globalLoading);

  useEffect(() => {
    const subscriber = (nextUser: User | null, nextLoading: boolean) => {
      setUser(nextUser);
      setLoading(nextLoading);
    };

    subscribers.add(subscriber);
    ensureAuthCoordinator();

    // Sync immediate initial state
    setUser(globalUser);
    setLoading(globalLoading);

    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  const loginWithGoogle = async () => {
    const { auth } = await initFirebase();
    if (!auth) throw new Error("Auth is not initialized");
    const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    const { auth } = await initFirebase();
    if (!auth) return;
    const { signOut } = await import("firebase/auth");
    try {
      await signOut(auth);
      useGuestMergeStore.getState().cancelMergeReview();
      useSyncDiagnosticsStore.getState().handleUserSwitch(null);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  return { user, loading, loginWithGoogle, logout };
}
