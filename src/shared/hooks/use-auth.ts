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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    initFirebase().then(({ auth }) => {
      if (!auth) {
        setLoading(false);
        return;
      }

      import("firebase/auth").then(({ onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          const newUid = currentUser?.uid || null;

          if (newUid) {
            const currentOwnerUid = getLocalDataOwnerUid();
            if (shouldResetLocalDataForAccount(currentOwnerUid, newUid)) {
              clearUserScopedReadingState();
              setLocalDataOwnerUid(newUid);
            } else if (currentOwnerUid === null) {
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
                    setUser(currentUser);
                    setLoading(false);
                    return;
                  } else {
                    setLocalDataOwnerUid(newUid);
                  }
                } catch (e) {
                  console.error("Failed to check cloud snapshot for guest merge", e);
                  setLocalDataOwnerUid(newUid);
                }
              } else {
                setLocalDataOwnerUid(newUid);
              }
            } else {
              setLocalDataOwnerUid(newUid);
            }
          }

          setUser(currentUser);
          setLoading(false);
        });
      }).catch((e) => {
        console.error(e);
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
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
    }
  };

  const logout = async () => {
    const { auth } = await initFirebase();
    if (!auth) return;
    const { signOut } = await import("firebase/auth");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return { user, loading, loginWithGoogle, logout };
}
