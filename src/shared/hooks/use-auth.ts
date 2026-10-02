import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { initFirebase } from '@/shared/lib/firebase';
import {
  getLocalDataOwnerUid,
  setLocalDataOwnerUid,
  shouldResetLocalDataForAccount,
} from "@/shared/lib/local-data-owner";
import { clearUserScopedReadingState } from "@/shared/lib/local-data-cleanup";

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

      import('firebase/auth').then(({ onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          const newUid = currentUser?.uid || null;

          if (newUid) {
            const currentOwnerUid = getLocalDataOwnerUid();
            if (shouldResetLocalDataForAccount(currentOwnerUid, newUid)) {
              clearUserScopedReadingState();
            }
            setLocalDataOwnerUid(newUid);
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
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
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
    const { signOut } = await import('firebase/auth');
    try {
      await signOut(auth);
      // Explicit logout intentionally keeps device-local reading data.
      // If another account signs in, the ownership guard above clears it before sync.
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return { user, loading, loginWithGoogle, logout };
}
