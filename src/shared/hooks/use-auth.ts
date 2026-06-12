import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { initFirebase } from '@/shared/lib/firebase';
import { useLibraryStore } from '@/shared/store/library-store';
import { useHistoryStore } from '@/shared/store/history-store';

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
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
      // Clear local state on explicit logout
      useLibraryStore.getState().clearLibrary();
      useHistoryStore.getState().clearHistory();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return { user, loading, loginWithGoogle, logout };
}
